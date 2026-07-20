import { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, Linking, StyleSheet } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import CandyButton from './CandyButton';
import { documentService } from '../services/documentService';
import { theme } from '../theme';

export default function OtherDocumentsList({ companyId, employeeId, readOnly = false }) {
  const [docs, setDocs] = useState([]);
  const [label, setLabel] = useState('');
  const [pendingFile, setPendingFile] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  async function load() {
    const all = await documentService.getDocumentsForEmployee(employeeId);
    setDocs(all.filter((d) => d.documentType === 'other'));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId]);

  async function handlePickFile() {
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
    setPendingFile(file);
  }

  async function handleAdd() {
    if (!pendingFile || !label.trim()) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const saved = await documentService.uploadDocument({
        companyId,
        employeeId,
        documentType: 'other',
        file: pendingFile,
        label,
      });
      if (saved.storageType === 'local') {
        setNotice('Saved on this device — will sync once the server is reachable.');
      }
      setLabel('');
      setPendingFile(null);
      // Prepend directly instead of re-fetching: a local-fallback record
      // isn't queryable from the server, so a full reload would make it
      // vanish immediately after it was just saved.
      setDocs((prev) => [saved, ...prev]);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove(id) {
    setBusy(true);
    setNotice('');
    try {
      await documentService.removeDocument(id);
      // Filter locally rather than re-fetching: a re-fetch only knows about
      // server-side records and would silently drop any other still-visible
      // local-fallback documents from the list.
      setDocs((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleView(doc) {
    try {
      const url = await documentService.resolveDocumentSource(doc);
      Linking.openURL(url);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <View style={styles.wrap}>
      {!readOnly && (
        <View style={styles.formCard}>
          <Text style={styles.label}>Label</Text>
          <TextInput
            style={styles.input}
            value={label}
            onChangeText={setLabel}
            placeholder="Offer Letter"
            placeholderTextColor={theme.colors.muted}
          />
          <CandyButton
            title={pendingFile ? `File selected: ${pendingFile.name}` : 'Choose File'}
            variant="secondary"
            small
            pill
            onPress={handlePickFile}
            style={styles.pickButton}
          />
          <CandyButton
            title="+ Add Document"
            variant="mustard"
            small
            pill
            disabled={!pendingFile || !label.trim() || busy}
            onPress={handleAdd}
            style={styles.addButton}
          />
          {notice ? <Text style={styles.notice}>{notice}</Text> : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>
      )}

      {docs.length === 0 ? (
        <Text style={styles.emptyText}>No additional documents.</Text>
      ) : (
        <View style={styles.list}>
          {docs.map((doc) => (
            <View key={doc.id} style={styles.row}>
              <View style={styles.rowInfo}>
                <Text style={styles.rowLabel} numberOfLines={1}>
                  {doc.label || doc.fileName}
                </Text>
                <Text style={styles.rowFileName} numberOfLines={1}>
                  {doc.fileName}
                </Text>
              </View>
              <Pressable onPress={() => handleView(doc)}>
                <Text style={styles.viewText}>View</Text>
              </Pressable>
              {!readOnly && (
                <Pressable disabled={busy} onPress={() => handleRemove(doc.id)}>
                  <Text style={styles.removeText}>Remove</Text>
                </Pressable>
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 12,
  },
  formCard: {
    borderRadius: theme.radius.chip,
    backgroundColor: theme.colors.inputFill,
    padding: 16,
  },
  label: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 13,
    color: theme.colors.ink,
    marginBottom: 6,
  },
  input: {
    borderRadius: theme.radius.button,
    backgroundColor: theme.colors.white,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontFamily: theme.fonts.body,
    fontSize: 14,
    color: theme.colors.ink,
    marginBottom: 10,
  },
  pickButton: {
    marginBottom: 10,
  },
  addButton: {},
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
  emptyText: {
    fontFamily: theme.fonts.body,
    fontSize: 12,
    color: theme.colors.muted,
  },
  list: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: theme.radius.chip,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    paddingHorizontal: 14,
    paddingVertical: 12,
    ...theme.clayShadow,
  },
  rowInfo: {
    flex: 1,
    minWidth: 0,
  },
  rowLabel: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 13,
    color: theme.colors.ink,
  },
  rowFileName: {
    fontFamily: theme.fonts.body,
    fontSize: 11,
    color: theme.colors.muted,
  },
  viewText: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 11,
    color: theme.colors.violet,
  },
  removeText: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 11,
    color: theme.colors.coral,
  },
});
