import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/body_composition_model.dart';
import '../services/body_composition_service.dart';

final bodyCompositionServiceProvider =
    Provider((ref) => BodyCompositionService());

final bodyCompositionHistoryProvider =
    FutureProvider<List<BodyCompositionModel>>((ref) async {
  final service = ref.watch(bodyCompositionServiceProvider);
  return service.getMyBodyCompositionHistory();
});

final latestBodyCompositionProvider =
    FutureProvider<BodyCompositionModel?>((ref) async {
  final service = ref.watch(bodyCompositionServiceProvider);
  return service.getLatestBodyComposition();
});

class BodyCompositionNotifier
    extends StateNotifier<AsyncValue<List<BodyCompositionModel>>> {
  final BodyCompositionService _service;

  BodyCompositionNotifier(this._service) : super(const AsyncValue.loading()) {
    loadHistory();
  }

  Future<void> loadHistory() async {
    state = const AsyncValue.loading();
    try {
      final history = await _service.getMyBodyCompositionHistory();
      state = AsyncValue.data(history);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  Future<void> refresh() async {
    await loadHistory();
  }
}

final bodyCompositionNotifierProvider = StateNotifierProvider<
    BodyCompositionNotifier, AsyncValue<List<BodyCompositionModel>>>((ref) {
  final service = ref.watch(bodyCompositionServiceProvider);
  return BodyCompositionNotifier(service);
});
