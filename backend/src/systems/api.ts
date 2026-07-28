import { createCanvas, Image } from "@gfx/canvas";
import * as fs from "@std/fs";
import { getCookies, serveFile } from "@std/http";
import type { Route } from "@std/http/unstable-route";
import { routeRadix } from "@std/http/unstable-route";
import * as path from "@std/path/posix";
import type { Instance } from "../index.ts";
import System from "../system.ts";

export default class ApiSystem extends System {
  routes: Route[];
  webServer!: Deno.HttpServer<Deno.NetAddr>;
  listening: boolean = false;

  constructor(instance: Instance) {
    super("api", instance);

    // deno-lint-ignore no-this-alias
    const self = this;

    this.routes = [
      {
        method: ["GET"],
        pattern: new URLPattern({
          pathname: "/api/teapot",
        }) as unknown as Route["pattern"],
        handler() {
          return Response.json(
            {
              teapot: true,
              message: "This OnlineWorkspace (Teapot?) sadly does not support the Hyper Text Coffee Pot Control Protocol (HTCPCP) 😢",
            },
            { status: 418 },
          ) as unknown as Response;
        },
      },
      {
        method: ["GET"],
        pattern: new URLPattern({ pathname: "/api/instance/login/banner" }),
        handler(req) {
          return serveFile(req, path.join(self.instance.sys.filesystem.FS_ROOT, "assets/login/banner.png"));
        },
      },
      {
        method: ["GET"],
        pattern: new URLPattern({ pathname: "/api/instance/login/background" }),
        handler(req) {
          return serveFile(req, path.join(self.instance.sys.filesystem.FS_ROOT, "assets/login/background.png"));
        },
      },
      {
        method: ["GET"],
        pattern: new URLPattern({ pathname: "/api/user/me/avatar/:size" }),
        async handler(req, rawParams, _info) {
          const params = rawParams?.pathname.groups;

          const size = params.size!;

          const cookies = getCookies(req.headers);

          if (!cookies.Authorization) {
            return Response.json({
              code: "UNAUTHORIZED",
              message: "missing auth cookie",
            }) as unknown as Response;
          }

          const userId = await self.instance.sys.authorization.verifySession(decodeURIComponent(cookies.Authorization!));

          if (userId === undefined) {
            return Response.json({
              code: "UNAUTHORIZED",
              message: "invalid session",
            }) as unknown as Response;
          }

          switch (size) {
            case "xs":
            case "s":
            case "m":
            case "l":
            case "xl":
            case "2xl":
              return serveFile(req, path.join(self.instance.sys.filesystem.FS_ROOT, `users/${userId}/assets/avatar/${size}.webp`));
            default:
              return serveFile(req, path.join(self.instance.sys.filesystem.FS_ROOT, `users/${userId}/assets/avatar/xs.webp`));
          }
        },
      },
      {
        method: ["GET"],
        pattern: new URLPattern({ pathname: "/api/application-icon/*" }),
        async handler(req, rawParams) {
          const params = rawParams?.pathname.groups["0"];

          const cookies = getCookies(req.headers);

          if (!cookies.Authorization) {
            return Response.json({
              code: "UNAUTHORIZED",
              message: "missing auth cookie",
            }) as unknown as Response;
          }

          const userId = await self.instance.sys.authorization.verifySession(decodeURIComponent(cookies.Authorization!));

          if (userId === undefined) {
            return Response.json({
              code: "UNAUTHORIZED",
              message: "invalid session",
            }) as unknown as Response;
          }

          const application = self.instance.sys.applications.availableApplications.find((a) => a.manifest?.id === params);

          if (!application) {
            return Response.json({
              code: "INTERNAL_ERROR",
              message: "Invalid application!",
            }) as unknown as Response;
          }

          const applicationIconPath = path.join(application.path, application.manifest?.icon?.value || "");

          return serveFile(req, applicationIconPath);
        },
      },
      {
        method: ["GET"],
        pattern: new URLPattern({
          pathname: "/api/asset/image/:imageId/:resolution",
        }),
        async handler(req, rawParams) {
          // @ts-ignore this does exist
          const params = rawParams?.pathname.groups;

          const image = self.instance.sys.image._internalImages.get(params.imageId as string);

          if (!image) {
            return new Response("Invalid image") as unknown as Response;
          }

          if (!image.public) {
            const cookies = getCookies(req.headers);

            if (!cookies.Authorization) {
              return Response.json({
                code: "UNAUTHORIZED",
                message: "missing auth cookie",
              }) as unknown as Response;
            }

            const userId = await self.instance.sys.authorization.verifySession(decodeURIComponent(cookies.Authorization!));

            if (userId === undefined) {
              return Response.json({
                code: "UNAUTHORIZED",
                message: "invalid session",
              }) as unknown as Response;
            }
          }

          const resolutionParam = params.resolution as string;

          const sourceImage = image[resolutionParam];

          if (!sourceImage) {
            return Response.json({
              code: "NOT_FOUND",
              message: "missing image",
            }) as unknown as Response;
          }

          if (resolutionParam === "raw") {
            self.instance.sys.image.log.debug(`Served Image -> '${(params as { imageId: string }).imageId} @ ${resolutionParam}'`);
            return serveFile(req, sourceImage.path);
          }

          const cachedFilePath = path.join(self.instance.sys.filesystem.CACHE_PATH, sourceImage.path.replaceAll(":", ""));
          const outputPath = path.join(cachedFilePath, resolutionParam);
          const hashPath = path.join(`${outputPath}.hash`);

          if (fs.existsSync(outputPath)) {
            const fileHash = await instance.sys.filesystem.getFileHash(sourceImage.path);
            const textDecoder = new TextDecoder("utf8");
            const cacheFileHash = textDecoder.decode(await Deno.readFile(hashPath));

            if (fileHash === cacheFileHash) {
              self.instance.sys.image.log.info(`Served Image -> '${(params as { imageId: string }).imageId} @ ${resolutionParam}'`);
              return serveFile(req, outputPath);
            }
          }

          if (!fs.existsSync(path.join(outputPath, ".."))) {
            await fs.ensureDir(path.join(outputPath, ".."));
          }

          const fileHash = await instance.sys.filesystem.getFileHash(sourceImage.path);
          await self.instance.sys.image.resizeImage(sourceImage.path, outputPath, sourceImage.resize!.dimensions, sourceImage.resize!);
          await Deno.writeFile(hashPath, Buffer.from(fileHash, "utf8"));

          self.instance.sys.image.log.info(`Served Image -> '${(params as { imageId: string }).imageId} @ ${resolutionParam}'`);
          return serveFile(req, outputPath);
        },
      },
      {
        method: ["GET"],
        pattern: new URLPattern({ pathname: "/api/asset/raw/:assetId" }),
        async handler(req, rawParams) {
          // @ts-ignore this does exist
          const params = rawParams?.pathname.groups;

          const asset = self.instance.sys.filesystem._internalAssets.get(params.assetId as string);

          if (!asset) {
            return new Response("Invalid raw asset") as unknown as Response;
          }

          if (!asset.public) {
            const cookies = getCookies(req.headers);

            if (!cookies.Authorization) {
              return Response.json({
                code: "UNAUTHORIZED",
                message: "missing auth cookie",
              }) as unknown as Response;
            }

            const userId = await self.instance.sys.authorization.verifySession(decodeURIComponent(cookies.Authorization!));

            if (userId === undefined) {
              return Response.json({
                code: "UNAUTHORIZED",
                message: "invalid session",
              }) as unknown as Response;
            }
          }

          return serveFile(req, asset.path);
        },
      },
      {
        method: ["GET"],
        pattern: new URLPattern({ pathname: "/api/asset/fileicon/:filetype/:iconsize" }),
        async handler(req, rawParams) {
          // @ts-ignore this does exist
          const params = rawParams?.pathname?.groups;

          const thumbCachePath = path.join(self.instance.sys.filesystem.CACHE_PATH, "fileicon", "filetype", params.filetype + "x" + params.iconsize);
          if (await fs.exists(thumbCachePath)) {
            return serveFile(req, thumbCachePath);
          } else {
            await fs.ensureDir(path.dirname(thumbCachePath))
          }

          if (isNaN(Number(params.iconsize)))
            return;

          const CANVAS_PADDING = 8;
          const CANVAS_WIDTH = Number(params.iconsize) || 128 ;
          const CANVAS_HEIGHT = Number(params.iconsize) || 128 

          const canvas = createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
          const ctx = canvas.getContext("2d");
          ctx.drawImage(Image.loadSync(path.join(self.instance.sys.filesystem.SRC_ROOT, "assets/placeholder/file.png")), 0, 0);

          ctx.font = `24px Arial`;
          ctx.textAlign = "end";
          ctx.textBaseline = "bottom";
          const LABEL_PADDING: { x: number; y: number } = { x: 4, y: 0 };
          const labelBr: { x: number; y: number } = {
            x: CANVAS_WIDTH - CANVAS_PADDING,
            y: CANVAS_HEIGHT - CANVAS_PADDING,
          };
          const textContent = `${params.filetype.toUpperCase().slice(0, 5)}`;
          const textSize = ctx.measureText(textContent);
          ctx.fillStyle = "#cc5588";
          ctx.fillRect(
            labelBr.x - (textSize.width + LABEL_PADDING.x * 2),
            labelBr.y - (textSize.emHeightAscent + LABEL_PADDING.y * 2),
            textSize.width + LABEL_PADDING.x * 2,
            textSize.emHeightAscent + LABEL_PADDING.y * 2,
          );
          ctx.fillStyle = "white";
          ctx.fillText(textContent, labelBr.x - LABEL_PADDING.x, labelBr.y + LABEL_PADDING.y);

          canvas.save(thumbCachePath, "png", 100);

          return serveFile(req, thumbCachePath);
        },
      },
      {
        pattern: new URLPattern({ pathname: "/api/trpc/*" }),
        async handler(req, _params) {
          return (
            (await self.instance.sys.tRPC.attemptTRPCRequest(req, self.instance.sys.api.webServer)) ||
            (Response.json(
              {
                notFound: true,
                message: "Unhandled by tRPC router",
              },
              { status: 404 },
            ) as unknown as Response)
          );
        },
      },
    ];
  }

  async addRoute(route: Route) {
    if (this.listening) {
      await this.stop();
      this.routes.push(route);
      await this.startup();
    } else {
      this.routes.push(route);
    }

    this.log.debug(`Registered api route at ${route.pattern.pathname} for ${route.method || route.method === undefined ? "All Methods" : "Unknown Method?"}`);

    return true;
  }

  getProxyBasePath(): string {
    return `${this.instance.sys.configuration.proxy.secure ? "https://" : "http://"}${this.instance.sys.configuration.proxy.hostname}`;
  }

  override async startup(): Promise<boolean> {
    if (this.listening) {
      this.log.warning("Something called startup() when we were already listening for requests!");
      return false;
    }

    this.listening = true;
    const self = this;
    this.webServer = Deno.serve(
      {
        port: this.instance.sys.configuration.apiPort,
        onListen(localAddr) {
          self.log.info(`Listening on port ${localAddr.port}`);
        },
      },
      routeRadix(this.instance.sys.api.routes, async (req) => {
        if (req.method === "OPTIONS") {
          const headers = new Headers();
          headers.set("access-control-allow-origin", this.instance.sys.configuration.proxy.hostname);
          headers.set("vary", "origin");
          headers.set("access-control-allow-methods", "GET, POST, PUT, DELETE");
          headers.set("access-control-allow-headers", "content-type, authorization");
          headers.set("access-control-max-age", "86400");
          return new Response(null, {
            status: 204,
            headers,
          }) as unknown as Response;
        }

        return Response.json(
          { notFound: true },
          {
            status: 404,
          },
        ) as unknown as Response;
      }),
    );

    this.webServer.finished.then(() => {
      this.log.info("webserver closed");
    });

    return true;
  }

  override async stop(): Promise<boolean> {
    await this.webServer?.shutdown?.();
    this.listening = false;

    return true;
  }
}
