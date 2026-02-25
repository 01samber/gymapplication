import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/body_composition_model.dart';

class BodyCompositionService {
  final _supabase = Supabase.instance.client;

  /// Get the full body composition history for the current client
  Future<List<BodyCompositionModel>> getMyBodyCompositionHistory() async {
    try {
      final user = _supabase.auth.currentUser;
      if (user == null) {
        throw Exception('User not authenticated');
      }

      final response = await _supabase
          .from('body_compositions')
          .select()
          .eq('client_id', user.id)
          .order('measurement_date', ascending: false);

      return (response as List)
          .map((json) => BodyCompositionModel.fromJson(json))
          .toList();
    } catch (e) {
      throw Exception('Failed to fetch body composition history: $e');
    }
  }

  /// Get the latest body composition for the current client
  Future<BodyCompositionModel?> getLatestBodyComposition() async {
    try {
      final user = _supabase.auth.currentUser;
      if (user == null) {
        throw Exception('User not authenticated');
      }

      final response = await _supabase
          .from('body_compositions')
          .select()
          .eq('client_id', user.id)
          .order('measurement_date', ascending: false)
          .limit(1)
          .maybeSingle();

      if (response != null) {
        return BodyCompositionModel.fromJson(response);
      }
      return null;
    } catch (e) {
      throw Exception('Failed to fetch latest body composition: $e');
    }
  }
}
