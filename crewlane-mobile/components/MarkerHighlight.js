import { Text } from 'react-native';
import { theme } from '../theme';

export default function MarkerHighlight({ children, textStyle }) {
  return <Text style={[textStyle, { color: theme.colors.violet }]}>{children}</Text>;
}
