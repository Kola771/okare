/**
 * Fonctions de l'API, mêmes noms et signatures que les routes de la section 21. Utilisables dans les composants
 * serveur comme client : elles passent par l'action serveur `rpc`, donc aucune donnée fictive n'est envoyée au navigateur.
 * Fichier généré à partir de `server/registry.ts` (ajouter une fonction là-bas, puis ici).
 */
import { ApiError } from './errors';
import { rpc } from './rpc';
import type { Registry } from './server/registry';

type Fn<K extends keyof Registry> = Registry[K] extends (...a: infer A) => Promise<infer R> ? (...a: A) => Promise<R> : never;

/** Fonctions qui changent la session : on prévient l'interface pour qu'elle relise le compte. */
const SESSION = new Set(['register', 'login', 'loginWithGoogle', 'logout', 'deleteMe', 'demoLoginAs']);

function call<K extends keyof Registry>(name: K): Fn<K> {
  return (async (...args: unknown[]) => {
    const res = await rpc(name, args);
    if ('error' in res) throw new ApiError(res.error.code, res.error.message, res.error.status, res.error.details);
    if (SESSION.has(name) && typeof window !== 'undefined') window.dispatchEvent(new Event('okare:session'));
    return res.data;
  }) as Fn<K>;
}

export const addFavorite = call('addFavorite');
export const addPosPhoto = call('addPosPhoto');
export const answerFollowUp = call('answerFollowUp');
export const assignMedia = call('assignMedia');
export const checkDuplicates = call('checkDuplicates');
export const claimWithCode = call('claimWithCode');
export const createCity = call('createCity');
export const createClaimCode = call('createClaimCode');
export const createContact = call('createContact');
export const createCountry = call('createCountry');
export const createPos = call('createPos');
export const createReport = call('createReport');
export const createReview = call('createReview');
export const createShareLink = call('createShareLink');
export const createZone = call('createZone');
export const deleteMe = call('deleteMe');
export const deleteMedia = call('deleteMedia');
export const deleteNeighborhood = call('deleteNeighborhood');
export const deletePos = call('deletePos');
export const demoLoginAs = call('demoLoginAs');
export const dishAction = call('dishAction');
export const forgotPassword = call('forgotPassword');
export const getAdminDashboard = call('getAdminDashboard');
export const getDish = call('getDish');
export const getDishCategories = call('getDishCategories');
export const getFavoriteIds = call('getFavoriteIds');
export const getFavoritesToday = call('getFavoritesToday');
export const getFeed = call('getFeed');
export const getFollowUp = call('getFollowUp');
export const getGeography = call('getGeography');
export const getManagedPos = call('getManagedPos');
export const getMap = call('getMap');
export const getMe = call('getMe');
export const getMediaLibrary = call('getMediaLibrary');
export const getMenu = call('getMenu');
export const getMyClaims = call('getMyClaims');
export const getMyContacts = call('getMyContacts');
export const getNotifications = call('getNotifications');
export const getPendingFollowUp = call('getPendingFollowUp');
export const getPos = call('getPos');
export const getPosAds = call('getPosAds');
export const getPosCover = call('getPosCover');
export const getPosHistory = call('getPosHistory');
export const getPosInfo = call('getPosInfo');
export const getPosReviews = call('getPosReviews');
export const getPosSheet = call('getPosSheet');
export const getPosStats = call('getPosStats');
export const getPriceGrid = call('getPriceGrid');
export const getReviews = call('getReviews');
export const getRolePermissions = call('getRolePermissions');
export const getSettings = call('getSettings');
export const getSharedReport = call('getSharedReport');
export const getVendorMe = call('getVendorMe');
export const getZones = call('getZones');
export const listAdsOverview = call('listAdsOverview');
export const listAudit = call('listAudit');
export const listClaims = call('listClaims');
export const listReports = call('listReports');
export const listTeamPos = call('listTeamPos');
export const listUsers = call('listUsers');
export const listVendors = call('listVendors');
export const listZonesAdmin = call('listZonesAdmin');
export const locate = call('locate');
export const login = call('login');
export const loginWithGoogle = call('loginWithGoogle');
export const logout = call('logout');
export const markPricesChecked = call('markPricesChecked');
export const moderatePos = call('moderatePos');
export const register = call('register');
export const removeFavorite = call('removeFavorite');
export const removePosCover = call('removePosCover');
export const repeatYesterdaySpecials = call('repeatYesterdaySpecials');
export const replyReview = call('replyReview');
export const requestClaim = call('requestClaim');
export const resolveQrCode = call('resolveQrCode');
export const resolveReport = call('resolveReport');
export const reviewClaim = call('reviewClaim');
export const reviewMedia = call('reviewMedia');
export const saveDish = call('saveDish');
export const saveNeighborhood = call('saveNeighborhood');
export const saveOpeningHours = call('saveOpeningHours');
export const savePriceGrid = call('savePriceGrid');
export const saveSettings = call('saveSettings');
export const search = call('search');
export const setCityActive = call('setCityActive');
export const setDayStatus = call('setDayStatus');
export const setFavoritesDigest = call('setFavoritesDigest');
export const setRolePermission = call('setRolePermission');
export const setUserBlocked = call('setUserBlocked');
export const setUserRoles = call('setUserRoles');
export const setZoneActive = call('setZoneActive');
export const updateMe = call('updateMe');
export const updatePosInfo = call('updatePosInfo');
export const updateVendorProfile = call('updateVendorProfile');
export const updateZone = call('updateZone');
