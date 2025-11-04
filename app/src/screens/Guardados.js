// src/screens/Guardados.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, SafeAreaView, StatusBar } from 'react-native';
import useHiddenStore from '../stores/hiddenStore';

const Guardados = ({ navigation }) => {
	const hiddenTours = useHiddenStore((s) => s.hiddenTours);
	const hiddenTestimonials = useHiddenStore((s) => s.hiddenTestimonials);
	const restoreTour = useHiddenStore((s) => s.restoreTour);
	const restoreTestimonial = useHiddenStore((s) => s.restoreTestimonial);

	const handleRestoreTour = (id) => {
		restoreTour(id);
		navigation.navigate('Home');
	};

	const handleRestoreTestimonial = (id) => {
		restoreTestimonial(id);
		navigation.navigate('Home');
	};

	const isEmpty = hiddenTours.length === 0 && hiddenTestimonials.length === 0;

	return (
		<SafeAreaView style={styles.container}>
			<StatusBar barStyle="dark-content" backgroundColor="#fff" />
			<View style={styles.header}>
				<Text style={styles.title}>Guardados</Text>
				<TouchableOpacity onPress={() => navigation.navigate('Home')}>
					<Text style={styles.link}>Volver a Home</Text>
				</TouchableOpacity>
			</View>

			{isEmpty ? (
				<View style={styles.emptyBox}>
					<Text style={styles.emptyText}>No hay elementos guardados</Text>
				</View>
			) : (
				<ScrollView contentContainerStyle={styles.content}>
					{/* Tours ocultos */}
					<Text style={styles.sectionTitle}>Tours ocultos</Text>
					{hiddenTours.length === 0 ? (
						<Text style={styles.smallMuted}>No hay tours</Text>
					) : (
						hiddenTours.map((tour) => (
							<View key={tour.id} style={styles.card}>
								<Image
									source={
										tour.image
											? (typeof tour.image === 'string' ? { uri: tour.image } : tour.image)
											: { uri: 'https://img.icons8.com/color/96/courthouse.png' }
									}
									style={styles.thumb}
								/>
								<View style={styles.info}>
									<Text style={styles.cardTitle}>{tour.title || 'Tour'}</Text>
									<TouchableOpacity style={styles.actionBtn} onPress={() => handleRestoreTour(tour.id)}>
										<Text style={styles.actionText}>Devolver</Text>
									</TouchableOpacity>
								</View>
							</View>
						))
					)}

					{/* Testimonios ocultos */}
					<Text style={[styles.sectionTitle, { marginTop: 16 }]}>Testimonios ocultos</Text>
					{hiddenTestimonials.length === 0 ? (
						<Text style={styles.smallMuted}>No hay testimonios</Text>
					) : (
						hiddenTestimonials.map((t) => (
							<View key={t.id} style={styles.card}>
								<Image
									source={t.authorImage ? (typeof t.authorImage === 'string' ? { uri: t.authorImage } : t.authorImage) : require('../../assets/homescreen.png')}
									style={styles.thumb}
								/>
								<View style={styles.info}>
									<Text style={styles.cardTitle}>{t.author || t.autor || 'Anónimo'}</Text>
									<TouchableOpacity style={styles.actionBtn} onPress={() => handleRestoreTestimonial(t.id)}>
										<Text style={styles.actionText}>Devolver</Text>
									</TouchableOpacity>
								</View>
							</View>
						))
					)}
				</ScrollView>
			)}
		</SafeAreaView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#FFFFFF',
	},
	header: {
		paddingHorizontal: 16,
		paddingTop: 12,
		paddingBottom: 8,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	title: {
		fontSize: 20,
		fontWeight: '700',
		color: '#111827',
	},
	link: {
		fontSize: 14,
		fontWeight: '600',
		color: '#4F46E5',
	},
	emptyBox: {
		marginTop: 40,
		alignItems: 'center',
	},
	emptyText: {
		fontSize: 16,
		color: '#6B7280',
	},
	content: {
		paddingHorizontal: 16,
		paddingBottom: 24,
	},
	sectionTitle: {
		fontSize: 16,
		fontWeight: '700',
		color: '#111827',
		marginBottom: 8,
	},
	smallMuted: {
		fontSize: 13,
		color: '#6B7280',
		marginBottom: 8,
	},
	card: {
		flexDirection: 'row',
		backgroundColor: '#fff',
		borderRadius: 12,
		padding: 12,
		marginBottom: 10,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.05,
		shadowRadius: 8,
		elevation: 2,
	},
	thumb: {
		width: 56,
		height: 56,
		borderRadius: 10,
		marginRight: 12,
	},
	info: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	cardTitle: {
		fontSize: 14,
		fontWeight: '700',
		color: '#111827',
		flex: 1,
		paddingRight: 8,
	},
	actionBtn: {
		backgroundColor: '#10B981',
		borderRadius: 10,
		paddingVertical: 8,
		paddingHorizontal: 12,
	},
	actionText: {
		color: '#fff',
		fontWeight: '700',
	},
});

export default Guardados;

