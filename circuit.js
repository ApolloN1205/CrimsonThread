// Draw the traces once. CSS animates the signal layer independently.
function drawCircuit() {
  const base = document.querySelector(".circuits");
  const signal = document.querySelector(".signals");
  const w = base.clientWidth, h = base.clientHeight;
  if (!w || !h) return;
  const layers = [base,signal].map(canvas => {
    const scale = Math.min(devicePixelRatio,2);
    canvas.width = w*scale; canvas.height = h*scale;
    const ctx = canvas.getContext("2d");
    ctx.scale(canvas.width/600,canvas.height/400);
    return ctx;
  });
  const [ctx, glow] = layers;
  for(let i=0;i<31;i++) {
    const band=Math.floor(i/8), lane=i%8;
    const x=62+band*67+lane*6;
    const y=84+band*61+lane*5;
    const bend=30+band*12;
    const path=new Path2D();
    path.moveTo(x-34,y+34); path.lineTo(x,y);path.lineTo(x+74,y);
    path.lineTo(x+74+bend,y-bend);path.lineTo(x+174+bend,y-bend);
    path.lineTo(x+196+bend,y-bend-22);path.lineTo(620,y-bend-22);
    ctx.strokeStyle=i%4===0?"#c12e49":"#611b2c";ctx.lineWidth=1;ctx.stroke(path);
    ctx.beginPath();ctx.arc(x-34,y+34,2.2,0,Math.PI*2);ctx.stroke();
    if(i%6===0){
      glow.strokeStyle="#ff526d";glow.lineWidth=1.6;
      glow.shadowBlur=5;glow.shadowColor="#ff2045";glow.setLineDash([16,600]);
      glow.lineDashOffset=-55-i*5;glow.stroke(path);
    }
  }
}
new ResizeObserver(drawCircuit).observe(document.querySelector(".circuits"));
