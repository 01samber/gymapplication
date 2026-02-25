/// Environment configuration for the app
///
/// Replace these values with your actual Supabase credentials
/// In production, use flutter_dotenv or --dart-define for security
class EnvConfig {
  EnvConfig._();

  /// Supabase project URL
  /// Your project ID is: jucjlxepcfhhlzieovmh
  /// So your URL is: https://jucjlxepcfhhlzieovmh.supabase.co
  static const String supabaseUrl = String.fromEnvironment(
    'SUPABASE_URL',
    defaultValue: 'https://jucjlxepcfhhlzieovmh.supabase.co',
  );

  /// Supabase anonymous/publishable key (safe to expose in client)
  /// Get this from: Supabase Dashboard > Settings > API Keys > Copy the publishable key
  /// Or use the Legacy anon key from the "Legacy anon, service_role API keys" tab
  static const String supabaseAnonKey = String.fromEnvironment(
    'SUPABASE_ANON_KEY',
    defaultValue:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1Y2pseGVwY2ZoaGx6aWVvdm1oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4NTk1NjksImV4cCI6MjA4NTQzNTU2OX0.GuuR9RsCVCIaf2_H2aF29sR7_grJI7nfzguoYXEK-eE',
  );

  /// App environment
  static const String environment = String.fromEnvironment(
    'ENV',
    defaultValue: 'development',
  );

  /// Check if running in production
  static bool get isProduction => environment == 'production';

  /// Check if running in development
  static bool get isDevelopment => environment == 'development';
}
