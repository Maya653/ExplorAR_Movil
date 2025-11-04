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

// Colores elegantes para las cartas de tours
const CARD_COLORS = [
	['#667EEA', '#764BA2'], // Púrpura-azul
	['#F093FB', '#F5576C'], // Rosa-coral
	['#4FACFE', '#00F2FE'], // Azul-cian
	['#43E97B', '#38F9D7'], // Verde-turquesa
	['#FFECD2', '#FCB69F'], // Naranja-melocotón
	['#A8EDEA', '#FED6E3'], // Menta-rosa
	['#D299C2', '#FEF9D7'], // Lavanda-amarillo suave
	['#89F7FE', '#66A6FF'], // Cian-azul
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

				<ScrollView 
					style={{ marginTop: 12 }} 
					contentContainerStyle={{ paddingBottom: 60, paddingTop: 8 }}
					showsVerticalScrollIndicator={false}
				>
					{loading ? (
						<ActivityIndicator size="large" color="#4F46E5" style={{ marginTop: 24 }} />
					) : (
						<View style={styles.grid}>
							{careerTours.length === 0 ? (
								<View style={styles.emptyState}>
									<Text style={styles.emptyIcon}>🎓</Text>
									<Text style={styles.emptyText}>No hay tours disponibles para esta carrera</Text>
									<Text style={[styles.emptyText, { fontSize: 14, marginTop: 4, opacity: 0.7 }]}>
										Pronto habrá contenido AR disponible
									</Text>
								</View>
							) : (
								careerTours.map((t, idx) => {
									const colors = CARD_COLORS[idx % CARD_COLORS.length];
									const badge = t.type || t.mode || 'AR';
									const progress = t.progress || Math.floor(Math.random() * 100); // Progreso aleatorio si no existe
									
									return (
										<TouchableOpacity 
											key={t.id || t._id || idx} 
											onPress={() => handleTourPress(t)}
											activeOpacity={0.85}
											style={{ marginBottom: 4 }}
										>
											<LinearGradient colors={colors} style={styles.card}>
												{/* Header con badge */}
												<View style={styles.cardHeader}>
													<View style={styles.cardBadge}>
														<Text style={styles.badgeText}>{badge}</Text>
													</View>
												</View>

												{/* Contenido principal */}
												<View style={styles.cardContent}>
													<Text style={styles.cardTitle}>{t.title}</Text>
													<Text style={styles.cardMeta}>
														{t.duration || 'Duración no especificada'} • 
														{t.description ? ` ${t.description.substring(0, 30)}...` : ' Experiencia inmersiva AR'}
													</Text>
												</View>

												{/* Footer con progreso y botón */}
												<View style={styles.cardFooter}>
													<View style={styles.cardProgress}>
														<Text style={styles.progressText}>
															{progress > 0 ? `${progress}% completado` : 'Nuevo'}
														</Text>
														{progress > 0 && (
															<View style={styles.progressBar}>
																<View style={[styles.progressFill, { width: `${progress}%` }]} />
															</View>
														)}
													</View>
													<TouchableOpacity 
														style={styles.playFloating}
														onPress={() => handleTourPress(t)}
														activeOpacity={0.8}
													>
														<PlayIcon size={20} color={'#FFFFFF'} />
													</TouchableOpacity>
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

	grid: { 
		marginTop: 16, 
		paddingHorizontal: 4,
	},
	card: {
		width: '100%',
		height: 180,
		borderRadius: 16,
		padding: 20,
		marginBottom: 16,
		justifyContent: 'space-between',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 8 },
		shadowOpacity: 0.15,
		shadowRadius: 12,
		elevation: 8,
	},
	cardHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'flex-start',
		marginBottom: 12,
	},
	cardBadge: {
		backgroundColor: 'rgba(255,255,255,0.9)',
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 20,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3,
	},
	badgeText: { 
		fontSize: 13, 
		fontWeight: '700', 
		color: '#111827',
		letterSpacing: 0.5,
	},
	cardContent: {
		flex: 1,
		justifyContent: 'center',
	},
	cardTitle: { 
		color: '#ffffff', 
		fontSize: 18, 
		fontWeight: '700',
		marginBottom: 8,
		lineHeight: 24,
		textShadowColor: 'rgba(0,0,0,0.3)',
		textShadowOffset: { width: 0, height: 1 },
		textShadowRadius: 2,
	},
	cardMeta: { 
		color: 'rgba(255,255,255,0.9)', 
		fontSize: 14,
		fontWeight: '500',
		textShadowColor: 'rgba(0,0,0,0.3)',
		textShadowOffset: { width: 0, height: 1 },
		textShadowRadius: 2,
	},
	cardFooter: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginTop: 16,
	},
	cardProgress: {
		flex: 1,
		marginRight: 12,
	},
	progressText: {
		color: 'rgba(255,255,255,0.8)',
		fontSize: 12,
		marginBottom: 4,
	},
	progressBar: {
		height: 4,
		backgroundColor: 'rgba(255,255,255,0.3)',
		borderRadius: 2,
		overflow: 'hidden',
	},
	progressFill: {
		height: '100%',
		backgroundColor: '#ffffff',
		borderRadius: 2,
	},
	playFloating: {
		width: 48,
		height: 48,
		borderRadius: 24,
		backgroundColor: 'rgba(255,255,255,0.15)',
		alignItems: 'center',
		justifyContent: 'center',
		borderWidth: 2,
		borderColor: 'rgba(255,255,255,0.3)',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.15,
		shadowRadius: 8,
		elevation: 6,
	},
	emptyState: {
		width: '100%',
		paddingVertical: 60,
		alignItems: 'center',
		backgroundColor: '#FFFFFF',
		borderRadius: 16,
		marginTop: 20,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.1,
		shadowRadius: 8,
		elevation: 4,
	},
	emptyText: {
		fontSize: 16,
		color: '#6B7280',
		textAlign: 'center',
		fontWeight: '500',
		marginTop: 12,
	},
	emptyIcon: {
		fontSize: 48,
		marginBottom: 8,
	},
});

export default CarreraScreen;