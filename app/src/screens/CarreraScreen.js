// src/screens/CarreraScreen.js - ACTUALIZADO CON COLORES INSTITUCIONALES CUORH
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
	Platform,
	Dimensions,
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

// ✅ COLORES INSTITUCIONALES CUORH
const COLORS = {
	primary: '#8A8D00',      // PANTONE 392 C - Verde olivo
	secondary: '#041E42',    // PANTONE 296 C - Azul marino
	white: '#FFFFFF',
	lightText: '#E5E7EB',
	mutedText: '#9CA3AF',
	accent: '#4F46E5',
	success: '#10B981',
	warning: '#F59E0B',
	error: '#EF4444',
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
	const { tours, fetchTours } = useTourStore();
	const { trackScreenView, trackTourStart } = useAnalyticsStore();
	
	const [loading, setLoading] = useState(true);
	const [careerTours, setCareerTours] = useState([]);

	useEffect(() => {
		console.log('📖 CarreraScreen montada:', career?.title);
		trackScreenView(`Career_${career?.title || 'Unknown'}`);
		
		loadTours();
	}, [career]);

	// ✅ FUNCIÓN CORREGIDA: Filtrar solo tours de esta carrera
	const loadTours = async () => {
		setLoading(true);
		try {
			await fetchTours();
			
			if (career?.id || career?._id) {
				const careerId = career.id || career._id;
				
				// ✅ Filtrar SOLO los tours asignados a esta carrera
				const filtered = tours.filter(tour => {
					const tourCareerId = tour.careerId || tour.career;
					const match = String(tourCareerId) === String(careerId);
					
					if (match) {
						console.log(`✅ Tour "${tour.title}" pertenece a "${career.title}"`);
					}
					
					return match;
				});
				
				console.log(`📊 ${filtered.length} tours encontrados para "${career.title}"`);
				setCareerTours(filtered);
			} else {
				console.warn('⚠️ Carrera sin ID, mostrando todos los tours');
				setCareerTours(tours);
			}
		} catch (error) {
			console.error('❌ Error cargando tours:', error);
			setCareerTours([]);
		} finally {
			setLoading(false);
		}
	};

	// ✅ FUNCIÓN PARA NAVEGAR AL VISOR AR
	const handleTourPress = (tour) => {
		console.log('🎬 Tour seleccionado:', tour.title);
		console.log('📋 Tipo de tour:', tour.type);
		
		// Registrar analytics
		trackTourStart(tour.id || tour._id, tour.title, career?.id || career?._id);
		
		// Detectar tipo de tour
		const tourType = tour.type?.toLowerCase();
		
		if (tourType === 'vr' || tourType === '360' || tourType === 'vr360') {
			// Tours VR 360°
			console.log('🥽 Navegando a visor VR 360°');
			navigation.navigate('VR360Viewer', {
				tourId: tour.id || tour._id,
				tourTitle: tour.title,
				careerId: career?.id || career?._id,
				careerTitle: career?.title,
			});
		} else {
			// Tours 3D
			console.log('🎨 Navegando a visor 3D');
			navigation.navigate('ARViewer', {
				tourId: tour.id || tour._id,
				tourTitle: tour.title,
				careerId: career?.id || career?._id,
				careerTitle: career?.title,
			});
		}
	};

	return (
		<View style={styles.container}>
			<StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

			{/* ✅ HEADER CON GRADIENTE INSTITUCIONAL */}
			<LinearGradient 
				colors={[COLORS.primary, COLORS.secondary]} 
				style={styles.header}
			>
				<View style={styles.headerTop}>
					<TouchableOpacity style={styles.iconCircle} onPress={() => navigation.goBack()}>
						<Image
							source={require('../../assets/flecha_retorno.png')}
							style={styles.smallIcon}
						/>
					</TouchableOpacity>
					<TouchableOpacity style={styles.iconCircleRight}>
						<HeartIcon size={20} color={COLORS.white} />
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
							{/* ✅ Mostrar contador real de tours */}
							<Text style={styles.statText}>{careerTours.length} tours</Text>
						</View>
						<View style={styles.statItem}>
							<ClockIcon />
							<Text style={styles.statText}>5 años</Text>
						</View>
					</View>
				</View>
			</LinearGradient>

			{/* ✅ CONTENIDO CON FONDO AZUL MARINO */}
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
					contentContainerStyle={{ paddingBottom: Platform.OS === 'ios' ? 80 : 60, paddingTop: 8 }}
					showsVerticalScrollIndicator={false}
				>
					{loading ? (
						<ActivityIndicator size="large" color={COLORS.white} style={{ marginTop: 24 }} />
					) : (
						<View style={styles.grid}>
							{/* ✅ Mensaje cuando NO hay tours asignados */}
							{careerTours.length === 0 ? (
								<View style={styles.emptyState}>
									<Text style={styles.emptyIcon}>🎓</Text>
									<Text style={styles.emptyText}>
										Aún no hay tours para esta carrera
									</Text>
									<Text style={[styles.emptyText, { fontSize: 14, marginTop: 4, opacity: 0.7 }]}>
										Los tours se agregarán próximamente
									</Text>
								</View>
							) : (
								/* ✅ Mostrar SOLO tours asignados */
								careerTours.map((t, idx) => {
									const colors = CARD_COLORS[idx % CARD_COLORS.length];
									const badge = t.type || t.mode || 'AR';
									const progress = t.progress || Math.floor(Math.random() * 100);
									
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
														<PlayIcon size={20} color={COLORS.white} />
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
		</View>
	);
};

const styles = StyleSheet.create({
	container: { 
		flex: 1, 
		backgroundColor: COLORS.secondary,
	},
	
	// ✅ HEADER CON COLORES INSTITUCIONALES
	header: {
		height: 260,
		paddingHorizontal: 16,
		paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 16 : 50,
		borderBottomLeftRadius: 24,
		borderBottomRightRadius: 24,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.2,
		shadowRadius: 8,
		elevation: 8,
	},
	headerTop: { 
		flexDirection: 'row', 
		justifyContent: 'space-between', 
		alignItems: 'center',
		marginBottom: 16,
	},
	iconCircle: {
		width: 44,
		height: 44,
		borderRadius: 22,
		backgroundColor: 'rgba(255,255,255,0.15)',
		alignItems: 'center',
		justifyContent: 'center',
		borderWidth: 1,
		borderColor: 'rgba(255,255,255,0.2)',
	},
	iconCircleRight: {
		width: 44,
		height: 44,
		borderRadius: 22,
		backgroundColor: 'rgba(255,255,255,0.15)',
		alignItems: 'center',
		justifyContent: 'center',
		borderWidth: 1,
		borderColor: 'rgba(255,255,255,0.2)',
	},
	smallIcon: { 
		width: 20, 
		height: 20, 
		tintColor: COLORS.white,
	},
	headerBody: { 
		marginTop: 8,
		flex: 1,
		justifyContent: 'center',
	},
	title: { 
		color: COLORS.white, 
		fontSize: 30, 
		fontWeight: '700', 
		marginBottom: 16,
		textShadowColor: 'rgba(0, 0, 0, 0.3)',
		textShadowOffset: { width: 0, height: 2 },
		textShadowRadius: 4,
	},
	statsRow: { 
		flexDirection: 'row', 
		alignItems: 'center',
		flexWrap: 'wrap',
	},
	statItem: { 
		flexDirection: 'row', 
		alignItems: 'center', 
		marginRight: 20,
		marginBottom: 8,
		backgroundColor: 'rgba(255, 255, 255, 0.1)',
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 12,
	},
	statText: { 
		color: COLORS.white, 
		marginLeft: 8,
		fontSize: 14,
		fontWeight: '600',
	},
	statIconImg: { 
		width: 18, 
		height: 18, 
		tintColor: COLORS.white,
	},

	// ✅ CONTENIDO
	contentCard: {
		flex: 1,
		marginTop: -40,
		paddingHorizontal: 16,
	},
	tabsRow: { 
		flexDirection: 'row', 
		backgroundColor: COLORS.white, 
		borderRadius: 12, 
		overflow: 'hidden', 
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 8,
		elevation: 4,
	},
	tabActive: { 
		flex: 1, 
		padding: 16, 
		alignItems: 'center', 
		borderBottomColor: COLORS.primary,
		borderBottomWidth: 3,
	},
	tabActiveText: { 
		color: COLORS.primary, 
		fontWeight: '700',
		fontSize: 15,
	},
	tabInactive: { 
		flex: 1, 
		padding: 16, 
		alignItems: 'center',
	},
	tabInactiveText: { 
		color: COLORS.mutedText, 
		fontWeight: '600',
		fontSize: 15,
	},

	// ✅ GRID DE TOURS
	grid: { 
		marginTop: 16, 
		paddingHorizontal: 4,
	},
	card: {
		width: '100%',
		height: 190,
		borderRadius: 18,
		padding: 20,
		marginBottom: 18,
		justifyContent: 'space-between',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 8 },
		shadowOpacity: 0.2,
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
		backgroundColor: 'rgba(255,255,255,0.95)',
		paddingHorizontal: 14,
		paddingVertical: 7,
		borderRadius: 20,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.15,
		shadowRadius: 4,
		elevation: 4,
	},
	badgeText: { 
		fontSize: 13, 
		fontWeight: '700', 
		color: COLORS.secondary,
		letterSpacing: 0.5,
	},
	cardContent: {
		flex: 1,
		justifyContent: 'center',
	},
	cardTitle: { 
		color: COLORS.white, 
		fontSize: 19, 
		fontWeight: '700',
		marginBottom: 8,
		lineHeight: 26,
		textShadowColor: 'rgba(0,0,0,0.4)',
		textShadowOffset: { width: 0, height: 1 },
		textShadowRadius: 3,
	},
	cardMeta: { 
		color: 'rgba(255,255,255,0.95)', 
		fontSize: 14,
		fontWeight: '500',
		lineHeight: 20,
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
		marginRight: 14,
	},
	progressText: {
		color: 'rgba(255,255,255,0.85)',
		fontSize: 12,
		marginBottom: 6,
		fontWeight: '500',
	},
	progressBar: {
		height: 5,
		backgroundColor: 'rgba(255,255,255,0.3)',
		borderRadius: 3,
		overflow: 'hidden',
	},
	progressFill: {
		height: '100%',
		backgroundColor: COLORS.white,
		borderRadius: 3,
	},
	playFloating: {
		width: 52,
		height: 52,
		borderRadius: 26,
		backgroundColor: 'rgba(255,255,255,0.2)',
		alignItems: 'center',
		justifyContent: 'center',
		borderWidth: 2,
		borderColor: 'rgba(255,255,255,0.4)',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.2,
		shadowRadius: 8,
		elevation: 6,
	},
	
	// ✅ EMPTY STATE
	emptyState: {
		width: '100%',
		paddingVertical: 70,
		alignItems: 'center',
		backgroundColor: COLORS.white,
		borderRadius: 18,
		marginTop: 20,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.1,
		shadowRadius: 12,
		elevation: 4,
	},
	emptyText: {
		fontSize: 16,
		color: COLORS.mutedText,
		textAlign: 'center',
		fontWeight: '500',
		marginTop: 12,
		paddingHorizontal: 24,
	},
	emptyIcon: {
		fontSize: 56,
		marginBottom: 12,
	},
});

export default CarreraScreen;