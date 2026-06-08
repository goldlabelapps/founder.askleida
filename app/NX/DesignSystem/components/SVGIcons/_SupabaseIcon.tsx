import * as React from 'react';
import { useTheme, SvgIcon } from '@mui/material';

export default function SupabaseIcon(props: any) {
  const theme = useTheme();
  let color1 = theme.palette.primary.main;
  return (
    <SvgIcon {...props}>
      <defs>
        <linearGradient x1="18.1541312%" y1="32.7120315%" x2="59.2308434%" y2="56.0951863%" id="linearGradient-1">
          <stop stopColor="#249361" offset="0%"></stop>
          <stop stopColor="#3ECF8E" offset="100%"></stop>
        </linearGradient>
        <linearGradient x1="20.1222347%" y1="-25.0227236%" x2="38.8553298%" y2="22.8418398%" id="linearGradient-2">
          <stop stopColor="#000000" offset="0%"></stop>
          <stop stopColor="#000000" stopOpacity="0" offset="100%"></stop>
        </linearGradient>
      </defs>
      <g id="SVGIcon" stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
        <g id="svg" transform="translate(-11.0007, -28.0006)">
          <rect id="24px_bg" fill="none" x="11.0007283" y="28.0006306" width="24" height="24"></rect>
          <g id="supabase" transform="translate(12.0007, 28.6506)">
            <path d="M12.8521707,22.6175869 C12.2771285,23.3572468 11.1047557,22.9533834 11.0913827,22.009523 L10.8907866,8.18741287 L20.020138,8.18741287 C21.6739414,8.18741287 22.5966834,10.1295872 21.5669568,11.4500843 L12.8521707,22.6175869 Z" id="Path" fill="url(#linearGradient-1)"></path>
            <path d="M12.8521707,22.6175869 C12.2771285,23.3572468 11.1047557,22.9533834 11.0913827,22.009523 L10.8907866,8.18741287 L20.020138,8.18741287 C21.6739414,8.18741287 22.5966834,10.1295872 21.5669568,11.4500843 L12.8521707,22.6175869 Z" id="Path" fillOpacity="0.2" fill="url(#linearGradient-2)"></path>
            <path d="M9.14337165,0.382413062 C9.71841381,-0.357246804 10.8907866,0.0466165587 10.9041596,0.990477001 L10.9933135,14.8080493 L1.97986205,14.8080493 C0.326058645,14.8080493 -0.596683414,12.865875 0.433043232,11.5453779 L9.14337165,0.382413062 Z" id="Path" fill="#3ECF8E"></path>
          </g>
        </g>
      </g>
    </SvgIcon>
  );
}
