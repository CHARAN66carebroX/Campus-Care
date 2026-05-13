export function attachSocket(io) {
  io.on('connection', (socket) => {
    socket.on('auth', ({ rooms }) => {
      if (!Array.isArray(rooms)) return;
      for (const r of rooms) {
        if (typeof r === 'string' && /^user:[a-f0-9]{24}$/i.test(r)) socket.join(r);
        if (typeof r === 'string' && /^college:[a-f0-9]{24}$/i.test(r)) socket.join(r);
        if (r === 'platform') socket.join('platform');
      }
    });
  });
}
