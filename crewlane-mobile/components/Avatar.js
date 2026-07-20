import { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { documentService } from '../services/documentService';
import { theme } from '../theme';

export default function Avatar({
  employeeId,
  name,
  size = 40,
  accentColor = theme.colors.violet,
  textStyle,
  style,
}) {
  const [photoUrl, setPhotoUrl] = useState(null);

  useEffect(() => {
    let active = true;
    async function load() {
      if (!employeeId) return;
      const record = await documentService.getDocument(employeeId, 'profilePhoto');
      if (!record) return;
      try {
        const url = await documentService.resolveDocumentSource(record);
        if (active) setPhotoUrl(url);
      } catch {
        // no backend/photo reachable — fall back to initials silently
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [employeeId]);

  const dimension = { width: size, height: size, borderRadius: size / 2 };

  if (photoUrl) {
    return <Image source={{ uri: photoUrl }} style={[dimension, styles.image, style]} />;
  }

  return (
    <View style={[dimension, styles.fallback, { backgroundColor: accentColor }, style]}>
      <Text style={[styles.initial, { fontSize: size * 0.42 }, textStyle]}>
        {(name || '?').trim().charAt(0).toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    resizeMode: 'cover',
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    fontFamily: theme.fonts.display,
    color: theme.colors.white,
  },
});
