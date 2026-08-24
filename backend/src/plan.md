# Backend Systems Plan

## Authentication
- getSessionRequirements(userId)
- createSession(userId, parameters: { password, timedOneTimePassCode, passkey })
- verifySession(authorizationCookie)
- getUserAuthMethods(userId)

### Password
- isSecondaryFactor = false
- setPassword()
- private verifyPassword()
 
### Timed One Time Pass
- isSecondaryFactor = true
- setTimedOneTimePassSecret()
- generateTimedOneTimePassSecret()
- private verifyIntermediaryTimedOneTimePassCode(generatedTimedOneTimePassSecret, userProvidedCode)
- private verifyTimedOneTimePassCode()

### Email Code
- isSecondaryFactor = true
- generateEmailOneTimeCode()
- sendEmailOneTimeCode()
- private verifyEmailOneTimeCode()

### Passkey
- isSecondaryFactor = false
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

### Bun Module APIs (SDK)
