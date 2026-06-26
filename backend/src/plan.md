# Backend Systems Plan

## Authorization
- getSessionRequirements(userId)
- createSession(userId, parameters: { password, timedOneTimePassCode, passkey })
- verifySession(authorizationCookie)
- getUserAuthMethods(userId)

### Password
- isSecondFactor = false
- setPassword()
- private verifyPassword()
 
### Timed One Time Pass
- isSecondFactor = true
- setTimedOneTimePassSecret()
- generateTimedOneTimePassSecret()
- private verifyIntermediaryTimedOneTimePassCode(generatedTimedOneTimePassSecret, userProvidedCode)
- private verifyTimedOneTimePassCode()

### Email Code
- isSecondFactor = true
- generateEmailOneTimeCode()
- sendEmailOneTimeCode()
- private verifyEmailOneTimeCode()

### Passkey
- isSecondFactor = false
- setPasskey()
- generatePasskey()
- private verifyIntermediaryPasskey(generatedPasskeySecret, userProvidedPasskey)
- private verifyPasskey()

## Applications

### Internal Module APIs (Direct globalThis.INSTANCE)
- FileSystem
- Applications
- Notifications
- Events
- Image
- Video
- ReverseProxy
- Settings
- tRPC
- Users
- WebFrontend
- Terminal
- Authorization
- Configuration
- ConsoleCommands
- Database
- Email

### External Module APIs (REST)

### Deno Module APIs (SDK)
