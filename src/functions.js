/** @param {Number} num */
export const exp = (pow=1)=> (10 ** pow)
export const round = (num, pow=1)=> Math.round(num * exp(pow))/exp(pow);
export const floor = (num, pow=1)=> Math.floor(num * exp(pow))/exp(pow);
export const ceil = (num, pow=1)=> Math.ceil(num * exp(pow))/exp(pow);
export const toExp = (num, place)=>{
  let pow = Math.floor(Math.log10(num));
	place = 10**place;
  return (Math.floor(num/(10**pow)*place)/place + `e${pow}`);
}
export const sci = (num, place=1)=> num >= 1000 ? toExp(num, place).replace("+", "") : round(num);
export const fix_big_num = (num, place)=>{
  const l = Math.floor(Math.log10(num));
  return Math.round(num / ((10**l)/(10**place)))*((10**l)/(10**place));
}
export const format_seconds = (secs, short=true)=>{
  let neg = secs < 0;
  if (neg) secs = Math.abs(secs);
  if (secs < 60) return `${neg ? '-' : ''}${round(secs, 0)}${short ? "s" : " Seconds"}`;
  secs /= 60;
  if (secs < 60) return `${neg ? '-' : ''}${ceil(secs)}${short ? "m" : " Minutes"}`;
  secs /= 60;
  if (secs < 60) return `${neg ? '-' : ''}${ceil(secs)}${short ? "h" : " Hours"}`;
  secs /= 24;
  if (secs < 24) return `${neg ? '-' : ''}${ceil(secs)}${short ? "d" : " Days"}`;
  secs /= 365;
  return `${neg ? '-' : ''}${ceil(secs)}${short ? "y" : " Years"}`;
}
export const run_n_times = (n, callback)=>{
  Array.from(Array(n)).forEach(callback);
}
export const floor_round = (num, place)=>{
  const pow = (Math.pow(10, place));
  return Math.floor(num * pow) / pow;
}
const num_shorts = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'O', 'N', 'D', 'UD', 'DD', 'TD', 'QuD', 'QiD', 'SxD', 'SpD', 'OD', 'ND', 'V', 'UV', 'DV', 'TV', 'QaV', 'QiV', 'SxV', 'SpV', 'OV', 'NV', 'T', 'UT', 'DT', 'TT', 'QaT', 'QiT', 'SxT', 'SpT', 'OT', 'NT'];
export const format_num = (num, round_to=1, i=0, past_thresh=false)=>{
    const div = num / 1000;
    const thresh = (i >= num_shorts.length);
    if (div < 1 || thresh) { 
      if (thresh) return (floor_round(num, round_to) + num_shorts[num_shorts.length-1]);
      else return (i == 0) ? (floor_round(num, round_to)) : (floor_round(num, round_to) + num_shorts[i]);
    }
    return format_num(div, round_to, i+1, thresh);
}