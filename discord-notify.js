(function () {
  let installed = false;

  function install() {
    if (installed || typeof sb === 'undefined' || !sb || typeof sb.rpc !== 'function') {
      return;
    }

    const originalRpc = sb.rpc.bind(sb);

    sb.rpc = async function (fn, args) {
      const result = await originalRpc(fn, args);

      try {
        if (!result.error && fn === 'create_wallet_order' && result.data) {
          await sb.functions.invoke('discord-notify', {
            body: {
              type: 'order',
              id: result.data
            }
          });
        }

        if (!result.error && fn === 'create_wallet_topup' && result.data?.id) {
          await sb.functions.invoke('discord-notify', {
            body: {
              type: 'topup',
              id: result.data.id
            }
          });
        }
      } catch (e) {
        console.warn('Discord notification failed:', e);
      }

      return result;
    };

    installed = true;
  }

  const timer = setInterval(() => {
    install();

    if (installed) {
      clearInterval(timer);
    }
  }, 200);

  setTimeout(() => clearInterval(timer), 15000);
})();
