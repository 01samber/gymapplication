-- Enable realtime for trainer_profiles (trainer list updates when new PT is added)
ALTER TABLE trainer_profiles REPLICA IDENTITY FULL;
