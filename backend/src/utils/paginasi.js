// Membaca ?page dan ?limit dengan batas aman.
export function bacaPaginasi(query, { limitDefault = 20, limitMaks = 50 } = {}) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(limitMaks, Math.max(1, Number.parseInt(query.limit, 10) || limitDefault));
  const dari = (page - 1) * limit;
  return { page, limit, dari, sampai: dari + limit - 1 };
}

export function metaPaginasi({ page, limit }, total) {
  return { page, limit, total, total_halaman: Math.max(1, Math.ceil(total / limit)) };
}
