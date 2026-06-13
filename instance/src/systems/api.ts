import { serveFile } from "@std/http/file-server";
import type { Route } from "@std/http/unstable-route";
import * as path from "@std/path/posix";
import nodeCanvas from "canvas";
import type { Instance } from "../index.ts";
import System from "../system.ts";

export default class ApiSystem extends System {
  private routes: Route[];

  constructor(instance: Instance) {
    super("api", instance);

    // deno-lint-ignore no-this-alias
    const self = this;

    this.routes = [
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
        async handler(req, _, rawParams) {
          // @ts-ignore this does exist
          const params = rawParams?.pathname.groups;

          const size = params.size;

          const cookieString = req.headers?.get("cookie");

          if (cookieString === null) {
            return Response.json({
              code: "UNAUTHORIZED",
              message: "missing auth cookie",
            });
          }

          const parsedCookie = Bun.Cookie.parse(cookieString);

          const userId = await self.instance.sys.authorization.verifySession(decodeURIComponent(parsedCookie.value));

          if (userId === undefined) {
            return Response.json({
              code: "UNAUTHORIZED",
              message: "invalid session",
            });
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
        pattern: new URLPattern({ pathname: "/api/application/:app/icon/" }),
        async handler(req, _, rawParams) {
          // @ts-ignore this does exist
          const params = rawParams?.pathname.groups;

          const app = (params as { app: string }).app;

          const cookieString = req.headers?.get("cookie");

          if (cookieString === null) {
            self.log.warning("Missing auth cookie in request for application icon");

            return Response.json({
              code: "UNAUTHORIZED",
              message: "missing auth cookie",
            });
          }

          const parsedCookie = Bun.Cookie.parse(cookieString);

          const userId = await self.instance.sys.authorization.verifySession(decodeURIComponent(parsedCookie.value));

          if (userId === undefined) {
            self.log.warning("Invalid session in request for application icon");

            return Response.json({
              code: "UNAUTHORIZED",
              message: "invalid session",
            });
          }

          const application = self.instance.sys.applications.availableApplications.find((a) => a.manifest?.id === app);

          if (!application)
            return Response.json({
              code: "INTERNAL_ERROR",
              message: "Invalid application!",
            });

          const applicationIconPath = path.join(application.path, application.manifest?.icon?.value || "");

          return serveFile(req, applicationIconPath);
        },
      },
      {
        method: ["GET"],
        pattern: new URLPattern({ pathname: "/api/asset/image/:imageId/:resolution" }),
        async handler(req, _, rawParams) {
          // @ts-ignore this does exist
          const params = rawParams?.pathname.groups;

          const image = self.instance.sys.image._internalImages.get(params.imageId as string);

          if (!image) {
            return new Response("Invalid image");
          }

          if (!image.public) {
            const cookieString = req.headers?.get("cookie");

            if (cookieString === null) {
              return Response.json({
                code: "UNAUTHORIZED",
                message: "missing auth cookie",
              });
            }

            const parsedCookie = Bun.Cookie.parse(cookieString);

            const userId = await self.instance.sys.authorization.verifySession(decodeURIComponent(parsedCookie.value));

            if (userId === undefined) {
              return Response.json({
                code: "UNAUTHORIZED",
                message: "invalid session",
              });
            }
          }

          const resolutionParam = params.resolution as string;

          const sourceImage = image[resolutionParam];

          if (!sourceImage) {
            return Response.json({
              code: "NOT_FOUND",
              message: "missing image",
            });
          }

          if (resolutionParam === "raw") {
            self.instance.sys.image.log.info(`Served Image -> '${(params as { imageId: string }).imageId} @ ${resolutionParam}'`);
            return serveFile(req, sourceImage.path);
          }

          return Response.json({ false: true });
          /* TODO: implement hashing again...  else {
            const cachedFilePath = path.join(self.instance.sys.filesystem.CACHE_PATH, sourceImage.path.replaceAll(":", ""));
            const outputPath = path.join(cachedFilePath, resolutionParam);
            const hashPath = path.join(`${outputPath}.hash`);

            if (fs.existsSync(outputPath)) {
              const fileHash = Bun.hash.rapidhash(await Deno.readFile(sourceImage.path)).toString();
              const cacheFileHash = (await Deno.readFile(hashPath)).toString();

              if (fileHash === cacheFileHash) {
                self.instance.sys.image.log.info(`Served Image -> '${(params as { imageId: string }).imageId} @ ${resolutionParam}'`);
                return serveFile(req, outputPath);
              }
            }

            if (!fs.existsSync(path.join(outputPath, ".."))) {
              await fs.ensureDir(path.join(outputPath, ".."));
            }

            const fileHash = Bun.hash.rapidhash(await Deno.readFile(sourceImage.path)).toString();
            await self.instance.sys.image.resizeImage(sourceImage.path, outputPath, sourceImage.resize!.dimensions, sourceImage.resize!);
            await Deno.writeFile(hashPath, Buffer.from(fileHash));

            self.instance.sys.image.log.info(`Served Image -> '${(params as { imageId: string }).imageId} @ ${resolutionParam}'`);
            return serveFile(req, outputPath);
          } */
        },
      },
      {
        method: ["GET"],
        pattern: new URLPattern({ pathname: "/api/asset/raw/:assetId" }),
        async handler(req, _, rawParams) {
          // @ts-ignore this does exist
          const params = rawParams?.pathname.groups;

          const asset = self.instance.sys.filesystem._internalAssets.get(params.assetId as string);

          if (!asset) {
            return new Response("Invalid raw asset");
          }

          if (!asset.public) {
            const cookieString = req.headers?.get("cookie");

            if (cookieString === null) {
              return Response.json({
                code: "UNAUTHORIZED",
                message: "missing auth cookie",
              });
            }

            const parsedCookie = Bun.Cookie.parse(cookieString);

            const userId = await self.instance.sys.authorization.verifySession(decodeURIComponent(parsedCookie.value));

            if (userId === undefined) {
              return Response.json({
                code: "UNAUTHORIZED",
                message: "invalid session",
              });
            }
          }

          return serveFile(req, asset.path);
        },
      },
      {
        method: ["GET"],
        pattern: new URLPattern({ pathname: "/api/asset/fileicon/:filetype" }),
        async handler(_req, _, rawParams) {
          // @ts-ignore this does exist
          const params = rawParams?.pathname.groups;

          const CANVAS_PADDING = 8;
          const CANVAS_WIDTH = 128;
          const CANVAS_HEIGHT = 128;
          const canvas = nodeCanvas.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
          const ctx = canvas.getContext("2d");
          ctx.drawImage(await nodeCanvas.loadImage(path.join(self.instance.sys.filesystem.SRC_ROOT, "assets/placeholder/file.png")), 0, 0);

          ctx.font = `20px Arial`;
          ctx.textAlign = "end";
          ctx.textBaseline = "bottom";
          const LABEL_PADDING: { x: number; y: number } = { x: 4, y: 0 };
          const labelBr: { x: number; y: number } = { x: CANVAS_WIDTH - CANVAS_PADDING, y: CANVAS_HEIGHT - CANVAS_PADDING };
          const textContent = `${params.filetype.toUpperCase().slice(0, 3)}`;
          const textSize = ctx.measureText(textContent);
          ctx.fillStyle = "#00aa00";
          ctx.fillRect(
            labelBr.x - (textSize.width + LABEL_PADDING.x * 2),
            labelBr.y - (textSize.emHeightAscent + LABEL_PADDING.y * 2),
            textSize.width + LABEL_PADDING.x * 2,
            textSize.emHeightAscent + LABEL_PADDING.y * 2,
          );
          ctx.fillStyle = "white";
          ctx.fillText(textContent, labelBr.x - LABEL_PADDING.x, labelBr.y + LABEL_PADDING.y);

          return new Response(canvas.createPNGStream());
        },
      },
    ];
  }
}
