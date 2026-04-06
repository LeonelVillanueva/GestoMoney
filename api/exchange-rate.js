/**
 * Vercel Serverless: tasa USD/HNL sin exponer la clave en el cliente.
 * Variable de entorno: EXCHANGE_API_KEY (solo en el panel de Vercel / servidor).
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.statusCode = 405
    res.setHeader('Allow', 'GET')
    return res.end('Method Not Allowed')
  }

  const key = process.env.EXCHANGE_API_KEY
  if (!key) {
    res.statusCode = 501
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    return res.end(JSON.stringify({ error: 'EXCHANGE_API_KEY no configurada en el servidor' }))
  }

  try {
    const upstream = await fetch(
      `https://v6.exchangerate-api.com/v6/${key}/pair/USD/HNL`
    )
    const text = await upstream.text()
    res.statusCode = upstream.status
    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json')
    return res.end(text)
  } catch (e) {
    res.statusCode = 502
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    return res.end(JSON.stringify({ error: 'Fallo al contactar el servicio de tasas' }))
  }
}
