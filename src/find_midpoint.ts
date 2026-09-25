export function getMidpoint(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
)  {
    const toRad = (deg: number) => deg * (Math.PI / 180)
    const toDeg = (rad: number) => rad * (180 / Math.PI)
    //midpoint formula obtained from: https://www.movable-type.co.uk/scripts/latlong.html
    //φ1  = radLat1
    const radLat1 = toRad(lat1);
    //λ1 = radLng1
    const radLng1 = toRad(lng1);
    //φ2  = radLat2
    const radLat2 = toRad(lat2);
    //λ1 = radLng2
    const radLng2 = toRad(lng2);

    //dLng = λ2-λ1
    const dLng = radLng2 - radLng1;
    
    //const Bx = Math.cos(φ2) * Math.cos(λ2-λ1);
    const Bx = Math.cos(radLat2) * Math.cos(dLng);
    //const By = Math.cos(φ2) * Math.sin(λ2-λ1);
    const By = Math.cos(radLat2) * Math.sin(dLng);

    //const φ3 = Math.atan2(Math.sin(φ1) + Math.sin(φ2),Math.sqrt( (Math.cos(φ1)+Bx)*(Math.cos(φ1)+Bx) + By*By ) );
    const latMid = Math.atan2(Math.sin(radLat1) + Math.sin(radLat2), Math.sqrt((Math.cos(radLat1) + Bx) * (Math.cos(radLat1) + Bx) + By * By));
    //const λ3 = λ1 + Math.atan2(By, Math.cos(φ1) + Bx);
    const lngMid = radLng1 + Math.atan2(By, Math.cos(radLat1) + Bx);

    return {
        lat: toDeg(latMid),
        lng: toDeg(lngMid)
    };
}