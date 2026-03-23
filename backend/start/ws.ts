import WebsocketService from '#services/websocket_service'
import app from '@adonisjs/core/services/app'

app.ready(() => {
  WebsocketService.boot()
})
