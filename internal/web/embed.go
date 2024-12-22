package web

import (
	"embed"
	"net/http"
)

//go:embed templates
var content embed.FS

func GetTemplates() *embed.FS {
	return &content
}

func ServeTemplate(w http.ResponseWriter, templateName string) error {
	templateContent, err := content.ReadFile("templates/" + templateName)
	if err != nil {
		return err
	}

	_, err = w.Write(templateContent)
	return err
}
