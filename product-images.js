function productImage(name=''){
  const n=String(name).toLowerCase();
  if(n.includes('netflix')||n.includes('نتفلكس')||n.includes('نتفليكس'))return 'assets/netflix.svg';
  if(n.includes('shahid')||n.includes('شاهد'))return 'assets/shahid.svg';
  if(n.includes('spotify')||n.includes('سبوتيفاي'))return 'assets/spotify.svg';
  if(n.includes('roblox')||n.includes('robux')||n.includes('روبلوكس'))return 'assets/robux.svg';
  if(n.includes('دراقون')||n.includes('dragon cannelloni')||n.includes('cannelloni'))return 'https://production-gameflipusercontent.fingershock.com/us-east-1%3A71f60d98-b8ed-4dec-b31b-28001bfdaf0a/f5b51031-e17c-4e7a-ab2a-81775ed0b511/abea5f1c-99c2-4bbc-9c95-803d2708ec93/640x640.webp';
  return '';
}
