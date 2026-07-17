# OnlineWorkspace Desktop Application Framework

Simplify the creation of OnlineWorkspace Desktop Applications

TODO:

- implement a login flow with instance selection
- implement multi-instance login support if reported as supported by the
  application configuration
- handle the login window styling (frameless) and add reset styling once logged
  in for the app to handle it themselves.


- Simple to import a SolidJS Component which contains a Solid Router, just as an application for the Web Interface would work
- Remove Application's Reliance on running inside the Web Interface, all ui should be shipped locally


(New) Application FS Layout
server/     (The Server Integrated Module)
desktop/    (User-Facing Component Framework)
web/        (User-Facing Component Framework)
frontend/   (The actual User UI)
