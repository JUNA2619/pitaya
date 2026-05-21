export async function fetchAuth(url, opciones = {}, onSesionExpirada) {
  try {
    const res = await fetch(url, opciones)
    if (res.status === 401) {
      const data = await res.clone().json().catch(() => ({}))
      if (data.detail?.includes("expirado") && onSesionExpirada) {
        onSesionExpirada()
        return null
      }
    }
    return res
  } catch (err) {
    throw err
  }
}