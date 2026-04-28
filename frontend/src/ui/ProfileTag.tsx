import React, { useEffect, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { fetchUserProfile, upsertUserProfile } from '../api/api';
import { getLang } from '../langSave';
import { useAuth } from './AuthContext';
import { LOTS } from './data/campusLots';
import type { RootStackParamList } from './RootNavigator';
import { COLORS } from './screens/colors';

type Props<RouteName extends keyof RootStackParamList = keyof RootStackParamList> = {
  navigation: NativeStackNavigationProp<RootStackParamList, RouteName>;
  variant?: 'overlay' | 'header';
};

const DEFAULT_FAVORITE_LOT = LOTS[0]?.name ?? 'P1';
const KNOWN_LOT_NAMES = new Set(LOTS.map((lot) => lot.name));

function normalizeFavoriteLot(favoriteLot?: string | null) {
  if (!favoriteLot) {
    return DEFAULT_FAVORITE_LOT;
  }

  const normalized = favoriteLot.trim().toUpperCase();
  return KNOWN_LOT_NAMES.has(normalized) ? normalized : DEFAULT_FAVORITE_LOT;
}

export default function ProfileTag<RouteName extends keyof RootStackParamList>({
  navigation,
  variant = 'overlay',
}: Props<RouteName>) {
  const { loggedIn, setIsAdmin, setLoggedIn, userId, setUserId } = useAuth();
  const [profileBadgeOpen, setProfileBadgeOpen] = useState(false);
  const [lotDropdownOpen, setLotDropdownOpen] = useState(false);
  const [favoriteLot, setFavoriteLot] = useState(DEFAULT_FAVORITE_LOT);
  const [profileUsername, setProfileUsername] = useState('');
  const [profileNotes, setProfileNotes] = useState('');
  const [profileBusy, setProfileBusy] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const lang = getLang();

  const text = {
    login: lang === 'en' ? 'Login' : 'Iniciar sesion',
    logout: lang === 'en' ? 'Logout' : 'Cerrar sesion',
    favoriteLot: lang === 'en' ? 'Favorite lot' : 'Lote favorito',
    username: lang === 'en' ? 'Username' : 'Nombre de usuario',
    usernamePlaceholder: lang === 'en' ? 'Choose a username' : 'Elige un nombre',
    notes: lang === 'en' ? 'Notes' : 'Notas',
    notesPlaceholder: lang === 'en' ? 'Add profile notes...' : 'Agrega notas...',
    profileMenu: lang === 'en' ? 'Profile menu' : 'Menu de perfil',
    saveProfile: lang === 'en' ? 'Save Profile' : 'Guardar perfil',
    savingProfile: lang === 'en' ? 'Saving...' : 'Guardando...',
    profileSaved: lang === 'en' ? 'Profile saved.' : 'Perfil guardado.',
    usernameFallback: lang === 'en' ? 'Set username' : 'Elige nombre',
  };

  const displayName = profileUsername.trim() || text.usernameFallback;

  useEffect(() => {
    if (!loggedIn || !userId) {
      setProfileBadgeOpen(false);
      setLotDropdownOpen(false);
      setFavoriteLot(DEFAULT_FAVORITE_LOT);
      setProfileUsername('');
      setProfileNotes('');
      setProfileBusy(false);
      setProfileError(null);
      setProfileSuccess(null);
      return;
    }

    let active = true;
    setProfileBusy(true);
    setProfileError(null);
    setProfileSuccess(null);

    fetchUserProfile(userId)
      .then((profile) => {
        if (!active) {
          return;
        }
        setProfileUsername(profile.username);
        setProfileNotes(profile.notes);
        setFavoriteLot(normalizeFavoriteLot(profile.favorite_lot));
      })
      .catch((error) => {
        if (!active) {
          return;
        }
        const message =
          error instanceof Error ? error.message : 'Failed to load profile.';
        setProfileError(message);
      })
      .finally(() => {
        if (active) {
          setProfileBusy(false);
        }
      });

    return () => {
      active = false;
    };
  }, [loggedIn, userId]);

  async function onSaveProfile() {
    if (!userId) {
      return;
    }

    setProfileBusy(true);
    setProfileError(null);
    setProfileSuccess(null);
    setLotDropdownOpen(false);

    try {
      const profile = await upsertUserProfile(
        userId,
        profileUsername,
        profileNotes,
        favoriteLot
      );
      setProfileUsername(profile.username);
      setProfileNotes(profile.notes);
      setFavoriteLot(normalizeFavoriteLot(profile.favorite_lot));
      setProfileSuccess(text.profileSaved);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to save profile.';
      setProfileError(message);
    } finally {
      setProfileBusy(false);
    }
  }

  function onLogout() {
    setLoggedIn(false);
    setUserId(null);
    setIsAdmin(false);
    setProfileBadgeOpen(false);
    setLotDropdownOpen(false);
    setFavoriteLot(DEFAULT_FAVORITE_LOT);
    setProfileError(null);
    setProfileSuccess(null);
  }

  function onOpenLogin() {
    setProfileBadgeOpen(false);
    setLotDropdownOpen(false);
    navigation.navigate('Login');
  }

  return (
    <View style={[styles.wrapper, variant === 'header' && styles.wrapperHeader]}>
      {loggedIn ? (
        <View style={styles.profileMenu}>
          <Pressable
            style={styles.profileTrigger}
            onPress={() => {
              setProfileBadgeOpen((prev) => !prev);
              setLotDropdownOpen(false);
            }}
            accessibilityLabel={text.profileMenu}
          >
            <View style={styles.avatarCircle}>
              <Image
                source={require('../../assets/images/avatar.png')}
                style={styles.avatarImage}
              />
            </View>
            <Text style={styles.profileName}>{displayName}</Text>
          </Pressable>

          {profileBadgeOpen ? (
            <View style={styles.profileBadge}>
              <Text style={styles.badgeLabel}>{text.username}</Text>
              <TextInput
                style={styles.profileInput}
                value={profileUsername}
                onChangeText={(value) => {
                  setProfileUsername(value);
                  if (profileSuccess) {
                    setProfileSuccess(null);
                  }
                }}
                placeholder={text.usernamePlaceholder}
                placeholderTextColor={COLORS.textSecondary}
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={32}
                editable={!profileBusy}
              />

              <Text style={styles.badgeLabel}>{text.favoriteLot}</Text>
              <Pressable
                style={[styles.favoriteSelect, profileBusy && styles.buttonDisabled]}
                onPress={() => setLotDropdownOpen((prev) => !prev)}
                disabled={profileBusy}
              >
                <Text style={styles.favoriteSelectText}>{favoriteLot}</Text>
                <Text style={styles.favoriteChevron}>{lotDropdownOpen ? '^' : 'v'}</Text>
              </Pressable>
              {lotDropdownOpen ? (
                <ScrollView style={styles.favoriteDropdown} nestedScrollEnabled>
                  {LOTS.map((lot) => (
                    <Pressable
                      key={lot.id}
                      style={[
                        styles.favoriteOption,
                        favoriteLot === lot.name && styles.favoriteOptionActive,
                      ]}
                      disabled={profileBusy}
                      onPress={() => {
                        setFavoriteLot(lot.name);
                        setLotDropdownOpen(false);
                        if (profileSuccess) {
                          setProfileSuccess(null);
                        }
                      }}
                    >
                      <Text style={styles.favoriteOptionText}>{lot.name}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              ) : null}

              <Text style={styles.badgeLabel}>{text.notes}</Text>
              <TextInput
                style={styles.notesInput}
                value={profileNotes}
                onChangeText={(value) => {
                  setProfileNotes(value);
                  if (profileSuccess) {
                    setProfileSuccess(null);
                  }
                }}
                placeholder={text.notesPlaceholder}
                placeholderTextColor={COLORS.textSecondary}
                multiline
                maxLength={160}
                editable={!profileBusy}
              />

              {profileError ? (
                <Text style={styles.profileErrorText}>{profileError}</Text>
              ) : null}
              {profileSuccess ? (
                <Text style={styles.profileSuccessText}>{profileSuccess}</Text>
              ) : null}

              <Pressable
                style={[styles.badgeSave, profileBusy && styles.buttonDisabled]}
                onPress={() => void onSaveProfile()}
                disabled={profileBusy}
              >
                <Text style={styles.badgeSaveText}>
                  {profileBusy ? text.savingProfile : text.saveProfile}
                </Text>
              </Pressable>

              <Pressable style={styles.badgeLogout} onPress={onLogout}>
                <Text style={styles.badgeLogoutText}>{text.logout}</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      ) : (
        <Pressable style={styles.loginBtn} onPress={onOpenLogin}>
          <Text style={styles.loginBtnText}>{text.login}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    alignItems: 'flex-end',
    zIndex: 20,
  },
  wrapperHeader: {
    marginRight: 12,
  },
  profileMenu: {
    alignItems: 'flex-end',
    zIndex: 21,
  },
  profileTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 18,
    backgroundColor: '#2b2b2b',
    borderWidth: 1,
    borderColor: '#3d3d3d',
  },
  avatarCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4f7d95',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  profileName: {
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  profileBadge: {
    position: 'absolute',
    top: '100%',
    right: 0,
    marginTop: 8,
    width: 240,
    minHeight: 220,
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#1f1f1f',
    borderWidth: 1,
    borderColor: '#3d3d3d',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  badgeLabel: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginBottom: 4,
  },
  favoriteSelect: {
    borderWidth: 1,
    borderColor: '#3d3d3d',
    backgroundColor: '#2b2b2b',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  favoriteSelectText: {
    color: COLORS.textPrimary,
    fontWeight: '600',
    fontSize: 12,
  },
  favoriteChevron: {
    color: COLORS.textSecondary,
    fontSize: 11,
  },
  favoriteDropdown: {
    maxHeight: 96,
    marginTop: 4,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3d3d3d',
    backgroundColor: '#141414',
  },
  favoriteOption: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  favoriteOptionActive: {
    backgroundColor: '#30424f',
  },
  favoriteOptionText: {
    color: COLORS.textPrimary,
    fontSize: 12,
  },
  profileInput: {
    borderWidth: 1,
    borderColor: '#3d3d3d',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 8,
    color: COLORS.textPrimary,
    fontSize: 12,
    backgroundColor: '#2b2b2b',
    marginBottom: 8,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#3d3d3d',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    minHeight: 40,
    maxHeight: 88,
    color: COLORS.textPrimary,
    fontSize: 12,
    backgroundColor: '#2b2b2b',
    textAlignVertical: 'top',
    marginBottom: 8,
  },
  badgeSave: {
    marginBottom: 8,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
  },
  badgeSaveText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  badgeLogout: {
    alignSelf: 'flex-end',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: '#3a3a3a',
  },
  badgeLogoutText: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  profileErrorText: {
    color: '#f97373',
    fontSize: 12,
    marginBottom: 8,
  },
  profileSuccessText: {
    color: '#86efac',
    fontSize: 12,
    marginBottom: 8,
  },
  loginBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#2b2b2b',
    borderWidth: 1,
    borderColor: '#3d3d3d',
  },
  loginBtnText: {
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
});
