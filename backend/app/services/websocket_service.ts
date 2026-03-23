import { WebSocketServer, WebSocket } from 'ws'
import server from '@adonisjs/core/services/server'

export default class WebsocketService {
  private static wss: WebSocketServer
  private static clients: Map<string, Set<WebSocket>> = new Map()

  /**
   * Boot the WebSocket server
   */
  public static boot() {
    if (this.wss) return

    // Attach to the AdonisJS HTTP server
    this.wss = new WebSocketServer({ server: server.getNodeServer() })

    this.wss.on('connection', (ws: WebSocket, request) => {
      const url = new URL(request.url || '', `http://${request.headers.host}`)
      const code = url.pathname.split('/').pop()

      if (code) {
        if (!this.clients.has(code)) {
          this.clients.set(code, new Set())
        }
        this.clients.get(code)!.add(ws)

        ws.on('close', () => {
          this.clients.get(code)?.delete(ws)
          if (this.clients.get(code)?.size === 0) {
            this.clients.delete(code)
          }
        })
      }
    })
  }

  /**
   * Broadcast message to a session
   */
  public static broadcast(code: string, payload: any) {
    const sessionClients = this.clients.get(code)
    if (sessionClients) {
      const message = JSON.stringify(payload)
      sessionClients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message)
        }
      })
    }
  }
}
