#https://docs.kick.com/apis/chat

APIs
Chat
Chat APIs allow you to use and interact with the chat that is available on the Kick website. You can send a message as a Bot account or your User account.

Post Chat Message
post

https://api.kick.com
/public/v1/chat
Post a chat message to a channel as a user or a bot. When sending as a user, the broadcaster_user_id is required. Whereas when sending as a bot, the broadcaster_user_id is not required and is ignored. As a bot, the message will always be sent to the channel attached to your token.

Required scopes
This endpoint requires the following scopes:
chat:write: Send chat messages and allow chat bots to post in your chat
Authorizations

UserAccessToken

UserAccessToken
OAuth2
authorizationCode
Authorization URL: https://id.kick.com/oauth/authorize
Token URL: https://id.kick.com/oauth/token
Body

application/json

application/json
broadcaster_user_id
integer
Example: 123
content
string · max: 500
Example: Pog
reply_to_message_id
string · uuid
Example: 828f83bb-e391-4c78-9e91-af35a172840e
type
string · enum
Possible values: userbot
Responses
200
OK

application/json

data
object · endpoints.ChatResp
message
string
400
Bad Request

application/json
401
Unauthorized

application/json
403
Forbidden

application/json
404
Not Found

application/json
429
Too Many Requests

application/json
500
Internal Server Error

application/json
post
/public/v1/chat

HTTP

HTTP

Copy
POST /public/v1/chat HTTP/1.1
Host: api.kick.com
Authorization: Bearer YOUR_OAUTH2_TOKEN
Content-Type: application/json
Accept: */*
Content-Length: 118

{
  "broadcaster_user_id": 123,
  "content": "Pog",
  "reply_to_message_id": "828f83bb-e391-4c78-9e91-af35a172840e",
  "type": "user"
}
Test it

200
OK



Copy
{
  "data": {
    "is_sent": true,
    "message_id": "828f83bb-e391-4c78-9e91-af35a172840e"
  },
  "message": "text"
}
Delete Chat Message
delete

https://api.kick.com
/public/v1/chat/
{message_id}
Delete a chat message from a channel.

Required scopes
This endpoint requires the following scopes:
moderation:chat_message:manage: Execute moderation actions on chat messages
Authorizations

UserAccessToken

UserAccessToken
OAuth2
authorizationCode
Authorization URL: https://id.kick.com/oauth/authorize
Token URL: https://id.kick.com/oauth/token
Path parameters
message_id
string
Message ID

Responses
204
No Content

No content

400
Bad Request

application/json
401
Unauthorized

application/json
403
Forbidden

application/json
404
Not Found

application/json
500
Internal Server Error

application/json