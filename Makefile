.DEFAULT_GOAL := helper
 
export SHELL = /bin/bash
export MK_TOOLS_FOLDER ?= .mk-tools
export MK_TOOLS_PATH ?= $(shell until [ -d "$(MK_TOOLS_FOLDER)" ] || [ "`pwd`" == '/' ]; do cd ..; done; pwd)/$(MK_TOOLS_FOLDER)
-include $(MK_TOOLS_PATH)/Makefile
 
info: ## informacion mk-tools
	@echo "MK_TOOLS_FOLDER : ${MK_TOOLS_FOLDER}"
	@echo "MK_TOOLS_PATH   : ${MK_TOOLS_PATH}"
	@echo "PWD $(shell echo ${PWD})"

mk-init: info ## instalar mk
	@rm -rf ${MK_TOOLS_FOLDER}/tmp
	@echo "instalando mk-tools..."
	@cat .gitignore | grep -q .entrypoint.mk || echo -en "\n.entrypoint.mk" >> .gitignore
	@cat .gitignore | grep -q .mk-tools || echo -en "\n.mk-tools" >> .gitignore
	@[ -d ".mk-tools" ] || git clone ssh://git@git.prod.aws.transbank.cl/dso/mk-tools.git -b release/support-tf-v1.5.7-1 --single-branch ${MK_TOOLS_FOLDER}
	@mkdir -p ${MK_TOOLS_FOLDER}/tmp
	@echo "mk-tools instalado exitosamente"

mk-clean: ## desinstala mk
	@rm -rf .entrypoint.mk ${MK_TOOLS_FOLDER}
	@echo "mk-tools desinstalado!"

mk-upgrade: ## actualiza mk
	@cd .mk-tools; git pull
	@echo "mk-tools actualizado!"

helper:
	@awk -F ':|##' '/^[^\t].+?:.*?##/ { printf "\033[36m%-30s\033[0m %s\n", $$1, $$NF }' $(MAKEFILE_LIST) | sort -u