import { View, Platform } from 'react-native';

let BlurView: any = View;

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  BlurView = require('expo-blur').BlurView;
} catch (e) {
  BlurView = View;
}

export function GlassView({ children, style, intensity = 30 }: any) {
  if (Platform.OS === 'android') {
    // Android fallback: translucent surface
    return <View style={[style, { backgroundColor: 'rgba(255,255,255,0.08)' }]}>{children}</View>;
  }

  return (
    <BlurView intensity={intensity} tint="dark" style={style}>
      {children}
    </BlurView>
  );
}
