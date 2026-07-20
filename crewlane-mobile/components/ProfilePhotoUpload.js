import { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Svg, { Circle, Path } from 'react-native-svg';
import CandyButton from './CandyButton';
import { documentService } from '../services/documentService';
import { theme } from '../theme';

function guessImageType(uri) {
  const ext = uri.split('.').pop()?.toLowerCase();
  if (ext === 'png') return 'image/png';
  return 'image/jpeg';
}

export default function ProfilePhotoUpload({ companyId, employeeId, readOnly = false }) {
  const [record, setRecord] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  async function load() {
    const doc = await documentService.getDocument(employeeId, 'profilePhoto');
    await showRecord(doc);
  }

  async function showRecord(doc) {
    setRecord(doc);
    if (doc) {
      try {
        setPreviewUrl(await documentService.resolveDocumentSource(doc));
      } catch {
        setPreviewUrl(null);
      }
    } else {
      setPreviewUrl(null);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId]);

  async function handlePick() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError('Photo library access is required to upload a profile photo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
    });
    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    const type = asset.mimeType || guessImageType(asset.uri);
    const name = asset.fileName || `profile-photo-${Date.now()}.jpg`;
    const file = { uri: asset.uri, type, name, size: asset.fileSize };

    const validationError = documentService.validateFile(file, { images_only: true });
    if (validationError) {
      setError(validationError);
      return;
    }
    setError('');
    setNotice('');
    setBusy(true);
    try {
      const saved = await documentService.uploadDocument({
        companyId,
        employeeId,
        documentType: 'profilePhoto',
        file,
      });
      if (saved.storageType === 'local') {
        setNotice('Saved on this device — will sync once the server is reachable.');
      }
      await showRecord(saved);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove() {
    if (!record) return;
    setBusy(true);
    setNotice('');
    try {
      await documentService.removeDocument(record.id);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.row}>
      <View style={styles.circle}>
        {previewUrl ? (
          <Image source={{ uri: previewUrl }} style={styles.image} />
        ) : (
          <Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
            <Circle
              cx={12}
              cy={8}
              r={4}
              stroke={theme.colors.muted}
              strokeWidth={2}
            />
            <Path
              d="M4 20c0-4 3.5-6 8-6s8 2 8 6"
              stroke={theme.colors.muted}
              strokeWidth={2}
              strokeLinecap="round"
            />
          </Svg>
        )}
      </View>
      {!readOnly && (
        <View style={styles.actions}>
          <View style={styles.buttonRow}>
            <CandyButton
              title={record ? 'Replace Photo' : 'Upload Photo'}
              variant="secondary"
              small
              pill
              disabled={busy}
              onPress={handlePick}
            />
            {record && (
              <CandyButton
                title="Remove"
                variant="secondary"
                small
                pill
                disabled={busy}
                onPress={handleRemove}
              />
            )}
          </View>
          <Text style={styles.hint}>JPG or PNG, max 5MB</Text>
          {notice ? <Text style={styles.notice}>{notice}</Text> : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  circle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: theme.colors.inputFill,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...theme.clayShadow,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  actions: {
    flex: 1,
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  hint: {
    fontFamily: theme.fonts.body,
    fontSize: 11,
    color: theme.colors.muted,
    marginTop: 8,
  },
  notice: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 11,
    color: theme.colors.mustard,
    marginTop: 4,
  },
  error: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 11,
    color: theme.colors.coral,
    marginTop: 4,
  },
});
