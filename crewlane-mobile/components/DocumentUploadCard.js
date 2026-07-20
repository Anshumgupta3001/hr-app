import { useEffect, useState } from 'react';
import { View, Text, Image, Pressable, Linking, StyleSheet } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import Svg, { Path } from 'react-native-svg';
import { documentService } from '../services/documentService';
import { theme } from '../theme';

function DocIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 2h9l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z"
        stroke={theme.colors.muted}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M15 2v5h5" stroke={theme.colors.muted} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function UploadIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M12 3v12" stroke={theme.colors.muted} strokeWidth={2} strokeLinecap="round" />
      <Path d="M7 8l5-5 5 5" stroke={theme.colors.muted} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path
        d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"
        stroke={theme.colors.muted}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export default function DocumentUploadCard({
  companyId,
  employeeId,
  documentType,
  label,
  readOnly = false,
  style,
}) {
  const [record, setRecord] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  async function load() {
    const doc = await documentService.getDocument(employeeId, documentType);
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
  }, [employeeId, documentType]);

  async function handlePick() {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['image/jpeg', 'image/png', 'application/pdf'],
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    const file = {
      uri: asset.uri,
      type: asset.mimeType || 'application/octet-stream',
      name: asset.name || 'document',
      size: asset.size,
    };

    const validationError = documentService.validateFile(file);
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
        documentType,
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

  async function handleView() {
    if (!record) return;
    try {
      const url = await documentService.resolveDocumentSource(record);
      Linking.openURL(url);
    } catch (err) {
      setError(err.message);
    }
  }

  const isImage = record && record.mimeType.startsWith('image/');

  return (
    <View style={[styles.card, style]}>
      <Text style={styles.label}>{label}</Text>
      {!record ? (
        readOnly ? (
          <Text style={styles.emptyText}>Not uploaded.</Text>
        ) : (
          <Pressable style={styles.dropzone} disabled={busy} onPress={handlePick}>
            <UploadIcon />
            <Text style={styles.dropzoneText}>Tap to upload</Text>
          </Pressable>
        )
      ) : (
        <View style={styles.filledRow}>
          <Pressable style={styles.thumb} onPress={handleView}>
            {isImage && previewUrl ? (
              <Image source={{ uri: previewUrl }} style={styles.thumbImage} />
            ) : (
              <DocIcon />
            )}
          </Pressable>
          <View style={styles.filledInfo}>
            <Text style={styles.fileName} numberOfLines={1}>
              {record.fileName}
            </Text>
            <View style={styles.actionRow}>
              <Pressable onPress={handleView}>
                <Text style={styles.actionView}>View</Text>
              </Pressable>
              {!readOnly && (
                <>
                  <Pressable disabled={busy} onPress={handlePick}>
                    <Text style={styles.actionText}>Replace</Text>
                  </Pressable>
                  <Pressable disabled={busy} onPress={handleRemove}>
                    <Text style={styles.actionRemove}>Remove</Text>
                  </Pressable>
                </>
              )}
            </View>
          </View>
        </View>
      )}
      {notice ? <Text style={styles.notice}>{notice}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: theme.radius.chip,
    backgroundColor: theme.colors.inputFill,
    padding: 14,
  },
  label: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 13,
    color: theme.colors.ink,
    marginBottom: 8,
  },
  emptyText: {
    fontFamily: theme.fonts.body,
    fontSize: 12,
    color: theme.colors.muted,
  },
  dropzone: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(99,95,105,0.3)',
    borderRadius: theme.radius.chip,
    paddingVertical: 20,
    alignItems: 'center',
    gap: 8,
  },
  dropzoneText: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 11,
    color: theme.colors.muted,
  },
  filledRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  thumb: {
    width: 52,
    height: 52,
    borderRadius: theme.radius.button,
    backgroundColor: theme.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...theme.clayShadow,
  },
  thumbImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  filledInfo: {
    flex: 1,
    minWidth: 0,
  },
  fileName: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 12,
    color: theme.colors.ink,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  actionView: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 11,
    color: theme.colors.violet,
  },
  actionText: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 11,
    color: theme.colors.ink,
  },
  actionRemove: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 11,
    color: theme.colors.coral,
  },
  notice: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 11,
    color: theme.colors.mustard,
    marginTop: 8,
  },
  error: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 11,
    color: theme.colors.coral,
    marginTop: 8,
  },
});
