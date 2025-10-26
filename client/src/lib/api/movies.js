import { supabase } from "../supabase";

export async function fetchActiveMovies(limit) {
	let query = supabase.from("movie_details").select("*").eq("status", "active");
	if (typeof limit === "number") {
		query = query.limit(limit);
	}
	const { data, error } = await query;
	if (error) throw error;
	return (data || []).map((movie) => ({
		...movie,
		_id: movie.id,
		genres: (movie.genres || []).map((name) => ({ name })),
	}));
}

export async function fetchMovieById(id) {
	const { data, error } = await supabase
		.from("movie_details")
		.select("*")
		.eq("id", id)
		.single();
	if (error) throw error;
	return {
		...data,
		_id: data.id,
		genres: (data.genres || []).map((name) => ({ name })),
		casts: [],
	};
}

export async function fetchMovieCasts(movieId) {
	const { data, error } = await supabase
		.from("movie_cast")
		.select(
			"order_index, character_name, cast_members:cast_id(id, name, profile_path)"
		)
		.eq("movie_id", movieId)
		.order("order_index", { ascending: true });
	if (error) throw error;
	return (data || []).map((row) => ({
		id: row.cast_members?.id,
		name: row.cast_members?.name,
		profile_path: row.cast_members?.profile_path,
		character_name: row.character_name,
	}));
}

