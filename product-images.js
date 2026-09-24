function productImage(name=''){
  const n=String(name).toLowerCase();
  if(n.includes('netflix')||n.includes('نتفلكس')||n.includes('نتفليكس'))return 'assets/netflix.svg';
  if(n.includes('shahid')||n.includes('شاهد'))return 'assets/shahid.svg';
  if(n.includes('spotify')||n.includes('سبوتيفاي'))return 'assets/spotify.svg';
  if(n.includes('roblox')||n.includes('robux')||n.includes('روبلوكس'))return 'assets/robux.svg';
  if(n.includes('دراقون')||n.includes('dragon cannelloni')||n.includes('cannelloni'))return 'https://yumcut.com/brainrot-data/dragon-cannelloni/original/prepared.webp';
  return '';
}
