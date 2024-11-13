package config

type Config struct {
	ServerPort  string
	StoragePath string
}

func NewConfig() *Config {
	return &Config{
		ServerPort:  "8080",
		StoragePath: "./data",
	}
}
