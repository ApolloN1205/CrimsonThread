function surface(canvas) {
  const w=canvas.clientWidth,h=canvas.clientHeight,ratio=Math.min(devicePixelRatio,2);
  canvas.width=w*ratio;canvas.height=h*ratio;
  const ctx=canvas.getContext("2d");
  ctx.scale(ratio,ratio);
  return {ctx,w,h};
}
function terrain(canvas) {
  const {ctx,w,h}=surface(canvas);
  ctx.fillStyle="#101014";ctx.fillRect(0,0,w,h);
  for(let row=0;row<65;row++){
    ctx.beginPath();
    for(let x=0;x<=w+2;x+=2){
      const u=x/w,v=row/64;
      const ridge=Math.exp(-((u-.42-v*.12)**2)/.048)*Math.exp(-((v-.5)**2)/.065);
      const detail=Math.sin(u*24+v*8)*.13+Math.cos(u*48-v*9)*.066;
      const y=h*(.28+v*.83-ridge*(.65+detail));
      if(x===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
    }
    ctx.strokeStyle='rgba(200,195,206,'+(.24+.45*row/65)+')';ctx.lineWidth=.8;ctx.stroke();
  }
}
window.drawArtwork=()=>{document.querySelectorAll(".terrain").forEach(terrain)};
window.addEventListener("resize",drawArtwork);drawArtwork();
