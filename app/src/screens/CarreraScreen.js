// src/screens/CarreraScreen.js
import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	SafeAreaView,
	StatusBar,
	Image,
	ScrollView,
	ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
	PlayIcon,
	StarIcon,
	ClockIcon,
	HeartIcon,
} from '../../components/Icons';

// Importar stores
import useTourStore from '../stores/tourStore';
import useAnalyticsStore from '../stores/analyticsStore';

// placeholder colors for tour cards
const CARD_COLORS = [
	['#6D28D9', '#4F46E5'],
	['#F97316', '#FB7185'],
	['#8B5CF6', '#EC4899'],
	['#06B6D4', '#10B981'],
];

const CarreraScreen = ({ route, navigation }) => {
	const { career } = route.params || {};
	
	// Zustand stores
	const { tours, fetchTours, getToursByCareer } = useTourStore();
	const { trackScreenView, trackTourStart } = useAnalyticsStore();
	
	const [loading, setLoading] = useState(true);
	const [careerTours, setCareerTours] = useState([]);

	useEffect(() => {
		console.log('📖 CarreraScreen montada:', career?.title);
		trackScreenView(`Career_${career?.title || 'Unknown'}`);
		
		loadTours();
	}, [career]);

	const loadTours = async () => {
		setLoading(true);
		try {
			await fetchTours();
			
			if (career?.id || career?._id) {
				const filtered = getToursByCareer(career.id || career._id);
				setCareerTours(filtered.length > 0 ? filtered : tours);
			} else {
				setCareerTours(tours);
			}
		} catch (error) {
			console.error('Error cargando tours:', error);
			setCareerTours([]);
		} finally {
			setLoading(false);
		}
	};

	// ✅ FUNCIÓN ACTUALIZADA PARA NAVEGAR AL VISOR AR
	const handleTourPress = (tour) => {
		console.log('🎬 Tour seleccionado:', tour.title);
		
		// Registrar analytics
		trackTourStart(tour.id || tour._id, tour.title, career?.id || career?._id);
		
		// ✅ Navegar al visor AR con el ID del tour
		navigation.navigate('ARViewer', {
			tourId: tour.id || tour._id,
			tourTitle: tour.title,
			careerId: career?.id || career?._id,
			careerTitle: career?.title,
		});
	};

	return (
		<SafeAreaView style={styles.container}>
			<StatusBar barStyle="light-content" translucent={false} />

			<LinearGradient colors={["#1E3A8A", "#3730A3"]} style={styles.header}>
				<View style={styles.headerTop}>
					<TouchableOpacity style={styles.iconCircle} onPress={() => navigation.goBack()}>
						<Image
							source={require('../../assets/flecha_retorno.png')}
							style={styles.smallIcon}
						/>
					</TouchableOpacity>
					<TouchableOpacity style={styles.iconCircleRight}>
						<HeartIcon size={20} color={'#FFFFFF'} />
					</TouchableOpacity>
				</View>

				<View style={styles.headerBody}>
					<Text style={styles.title}>{career?.title || 'Carrera'}</Text>
					<View style={styles.statsRow}>
						<View style={styles.statItem}>
							<StarIcon />
							<Text style={styles.statText}>{career?.rating || '0.0'}</Text>
						</View>
						<View style={styles.statItem}> 
							<Image source={require('../../assets/icono_grupo.png')} style={styles.statIconImg} />
							<Text style={styles.statText}>{career?.reviews || career?.tours || '—'}</Text>
						</View>
						<View style={styles.statItem}>
							<ClockIcon />
							<Text style={styles.statText}>5 años</Text>
						</View>
					</View>
				</View>
			</LinearGradient>

			<View style={styles.contentCard}>
				<View style={styles.tabsRow}>
					<View style={styles.tabActive}>
						<Text style={styles.tabActiveText}>Overview</Text>
					</View>
					<TouchableOpacity style={styles.tabInactive}>
						<Text style={styles.tabInactiveText}>Tours AR</Text>
					</TouchableOpacity>
				</View>

				<ScrollView style={{ marginTop: 12 }} contentContainerStyle={{ paddingBottom: 40 }}>
					{loading ? (
						<ActivityIndicator size="large" color="#4F46E5" style={{ marginTop: 24 }} />
					) : (
						<View style={styles.grid}>
							{careerTours.length === 0 ? (
								<View style={styles.emptyState}>
									<Text style={styles.emptyText}>No hay tours disponibles para esta carrera</Text>
								</View>
							) : (
								careerTours.map((t, idx) => {
									const colors = CARD_COLORS[idx % CARD_COLORS.length];
									const badge = t.type || t.mode || 'AR';
									return (
										<TouchableOpacity 
											key={t.id || t._id || idx} 
											onPress={() => handleTourPress(t)}
											activeOpacity={0.8}
										>
											<LinearGradient colors={colors} style={styles.card}>
												<View style={styles.cardBadge}>
													<Text style={styles.badgeText}>{badge}</Text>
												</View>
												<Text style={styles.cardTitle}>{t.title}</Text>
												<Text style={styles.cardMeta}>{t.duration || '—'}</Text>
												<View style={styles.playFloating}>
													<PlayIcon size={18} color={'#FFFFFF'} />
												</View>
											</LinearGradient>
										</TouchableOpacity>
									);
								})
							)}
						</View>
					)}
				</ScrollView>
			</View>
		</SafeAreaView>
	);
};

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: '#F3F4F6' },
	header: {
		height: 260,
		paddingHorizontal: 16,
		paddingTop: 12,
		borderBottomLeftRadius: 24,
		borderBottomRightRadius: 24,
	},
	headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
	iconCircle: {
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: 'rgba(255,255,255,0.12)',
		alignItems: 'center',
		justifyContent: 'center',
	},
	iconCircleRight: {
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: 'rgba(255,255,255,0.12)',
		alignItems: 'center',
		justifyContent: 'center',
	},
	smallIcon: { width: 18, height: 18, tintColor: '#fff' },
	headerBody: { marginTop: 16 },
	title: { color: '#FFFFFF', fontSize: 28, fontWeight: '700', marginBottom: 12 },
	statsRow: { flexDirection: 'row', alignItems: 'center' },
	statItem: { flexDirection: 'row', alignItems: 'center', marginRight: 16 },
	statText: { color: '#FFFFFF', marginLeft: 8 },
	statIconImg: { width: 16, height: 16, tintColor: '#FFFFFF' },

	contentCard: {
		flex: 1,
		marginTop: -40,
		paddingHorizontal: 16,
	},
	tabsRow: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 8, overflow: 'hidden', elevation: 2 },
	tabActive: { flex: 1, padding: 14, alignItems: 'center', borderBottomColor: '#4F46E5', borderBottomWidth: 3 },
	tabActiveText: { color: '#4F46E5', fontWeight: '600' },
	tabInactive: { flex: 1, padding: 14, alignItems: 'center' },
	tabInactiveText: { color: '#6B7280', fontWeight: '600' },

	grid: { marginTop: 16, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
	card: {
		width: '48%',
		height: 140,
		borderRadius: 12,
		padding: 12,
		marginBottom: 12,
		justifyContent: 'flex-end',
	},
	cardBadge: {
		position: 'absolute',
		top: 10,
		left: 10,
		backgroundColor: 'rgba(255,255,255,0.85)',
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: 12,
	},
	badgeText: { fontSize: 12, fontWeight: '700', color: '#111827' },
	cardTitle: { color: '#ffffff', fontSize: 14, fontWeight: '700' },
	cardMeta: { color: '#ffffff', fontSize: 12, marginTop: 6 },
	playFloating: {
		position: 'absolute',
		right: 12,
		bottom: 12,
		width: 44,
		height: 44,
		borderRadius: 22,
		backgroundColor: '#4F46E5',
		alignItems: 'center',
		justifyContent: 'center',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.12,
		shadowRadius: 6,
		elevation: 6,
	},
	emptyState: {
		width: '100%',
		paddingVertical: 40,
		alignItems: 'center',
	},
	emptyText: {
		fontSize: 14,
		color: '#6B7280',
		textAlign: 'center',
	},
});

export default CarreraScreen;