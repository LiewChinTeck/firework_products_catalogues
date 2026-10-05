export function youtubeId(value:string):string|null {
 const text=value.trim(),valid=(id:string|null)=>id&&/^[A-Za-z0-9_-]{11}$/.test(id)?id:null;
 if(valid(text))return text;
 try {
  const url=new URL(text);
  if(!['https:','http:'].includes(url.protocol)||url.username||url.password||url.port)return null;
  const host=url.hostname.toLowerCase(),parts=url.pathname.split('/').filter(Boolean);
  if(host==='youtu.be')return parts.length===1?valid(parts[0]):null;
  if(!['youtube.com','www.youtube.com','m.youtube.com','youtube-nocookie.com','www.youtube-nocookie.com'].includes(host))return null;
  if(url.pathname==='/watch'&&!host.includes('nocookie'))return valid(url.searchParams.get('v'));
  return parts.length===2&&['embed','shorts','live'].includes(parts[0])?valid(parts[1]):null;
 }catch{return null;}
}
