import TabController from "../../../tool/tab-controller.js";
import { CATEGORY, DIET, UNIT } from "./enums.js"



/**
 * Recipe editor tab controller type.
 */
class RecipeEditorTabController extends TabController {
	#victuals;


	/**
	 * Initializes a new instance.
	 */
	constructor () {
		super("recipe-editor");
		this.#victuals = [];

		// register controller event listeners 
		this.addEventListener("activated", event => this.processActivated());
	}


	// HTML element getter operations
	get viewsSectionTemplate () { return document.querySelector("head>template.recipes-view"); }
	get viewsRowTemplate () { return document.querySelector("head>template.recipes-view-row"); }
	get editorSectionTemplate () { return document.querySelector("head>template.recipe-editor"); }
	get editorIngredientRowTemplate () { return document.querySelector("head>template.recipe-editor-ingredient-row"); }
	get editorIllustrationRowTemplate () { return document.querySelector("head>template.recipe-editor-illustration-row"); }
	
	get viewsSection () { return this.center.querySelector("section.recipes-view"); }
	get viewsTableBody () { return this.viewsSection.querySelector("div.recipes>table>tbody"); }

	get editorSection () { return this.center.querySelector("section.recipe-editor"); }
	get editorAvatarButton () { return this.editorSection.querySelector("span.avatar>button"); }
	get editorAvatarViewer () { return this.editorAvatarButton.querySelector("img"); }
	get editorAvatarChooser () { return this.editorSection.querySelector("span.avatar>input"); }
	get editorTitleInput () { return this.editorSection.querySelector("div.title>input"); }
	get editorDietOutput () { return this.editorSection.querySelector("div.diet>input"); }
	get editorCategorySelector () { return this.editorSection.querySelector("div.category>select"); }
	get editorDescriptionArea () { return this.editorSection.querySelector("div.description>textarea"); }
	get editorInstructionArea () { return this.editorSection.querySelector("div.instruction>textarea"); }
	get editorSubmitButton () { return this.editorSection.querySelector("div.control>button.submit"); }
	get editorDeleteButton () { return this.editorSection.querySelector("div.control>button.delete"); }
	get editorCancelButton () { return this.editorSection.querySelector("div.control>button.cancel"); }
	get editorIngredientsDivision () { return this.editorSection.querySelector("div.ingredients"); }
	get editorIngredientsTableBody () { return this.editorIngredientsDivision.querySelector("table>tbody"); }
	get editorAddButton () { return this.editorIngredientsDivision.querySelector("button.add"); }
	get editorIllustrationsDivision () { return this.editorSection.querySelector("div.illustrations"); }
	get editorIllustrationsTableBody () { return this.editorIllustrationsDivision.querySelector("table>tbody"); }
	get editorDropTargetButton () { return this.editorIllustrationsDivision.querySelector("div.drop-target>button"); }
	get editorDropTargetViewer () { return this.editorDropTargetButton.querySelector("img"); }
	get editorDropTargetChooser () { return this.editorIllustrationsDivision.querySelector("div.drop-target>input"); }


	/**
	 * Handles that activity has changed from false to true.
	 */
	processActivated () {
		this.messageOutput.value = "";

		// redefine center content
		while (this.center.lastElementChild) this.center.lastElementChild.remove();
		this.center.append(this.viewsSectionTemplate.content.firstElementChild.cloneNode(true));

		// register basic event listeners
		const createButton = this.constructor.createButton("neu");
		createButton.classList.add("create");
		createButton.addEventListener("click", event => this.processDisplayRecipeEditor());
		this.viewsSection.querySelector("div.control").append(createButton);

		return this.displayEditableRecipes();
	}


	/**
	 * Queries the recipes that can be edited by the
	 * requester, and displays them within the root section.
	 */
	async displayEditableRecipes () {
		try {
			const victualsPromise = this.#invokeQueryAllVictuals();
			const recipes = await this.#invokeQueryEditableRecipes();

			this.viewsTableBody.innerHTML = "";
			for (const recipe of recipes) {
				const tableRow = this.viewsRowTemplate.content.firstElementChild.cloneNode(true);
				this.viewsTableBody.append(tableRow);

				const accessButton = tableRow.querySelector("td.access>button");
				accessButton.addEventListener("click", event => this.processDisplayRecipeEditor(recipe));
				accessButton.querySelector("img").src = this.sharedProperties["service-origin"] + "/services/documents/" + recipe.avatar.identity;
				tableRow.querySelector("td.title").innerText = recipe.title || "";
				tableRow.querySelector("td.diet").innerText = DIET[recipe.diet] || "";
				tableRow.querySelector("td.category").innerText = CATEGORY[recipe.category] || "";
				tableRow.querySelector("td.ingredient-count").innerText = recipe.ingredientCount.toString();
				tableRow.querySelector("td.modified").innerText = new Date(recipe.modified).toLocaleDateString();
			}

			this.#victuals = await victualsPromise;
			this.messageOutput.value = "";
		} catch (error) {
			this.messageOutput.value = error.message || error.toString();
			console.error(error);
		}
	}


	/**
	 * Displays the given recipe in a new editor section.
	 * @param recipe the recipe, or a new object for none
	 */
	async processDisplayRecipeEditor (recipe = {}) {
		this.viewsSection.classList.add("hidden");

		try {
			this.center.append(this.editorSectionTemplate.content.firstElementChild.cloneNode(true));

			this.editorSubmitButton.addEventListener("click", event => this.processSubmitRecipe(recipe));
			this.editorDeleteButton.addEventListener("click", event => this.processDeleteRecipe(recipe));
			this.editorCancelButton.addEventListener("click", event => this.processCancel());
			this.editorAddButton.addEventListener("click", event => this.processSubmitIngredient(recipe));

			this.editorAvatarButton.addEventListener("click", event => this.editorAvatarChooser.click());
			this.editorAvatarViewer.addEventListener("dragover", event => this.validateAvatarTransfer(event.dataTransfer));
			this.editorAvatarViewer.addEventListener("drop", event => this.processSubmitAvatar(recipe, event.dataTransfer.files[0]));
			this.editorAvatarChooser.addEventListener("change", event => this.processSubmitAvatar(recipe, event.target.files[0]));

			this.editorDropTargetButton.addEventListener("click", event => this.editorDropTargetChooser.click());
			this.editorDropTargetViewer.addEventListener("dragover", event => this.validateIllustrationTransfer(event.dataTransfer));
			this.editorDropTargetViewer.addEventListener("drop", event => this.processAddIllustrations(recipe, event.dataTransfer.files));
			this.editorDropTargetChooser.addEventListener("change", event => this.processAddIllustrations(recipe, event.target.files));

			this.editorAvatarViewer.src = this.sharedProperties["service-origin"] + "/services/documents/" + (recipe.avatar ? recipe.avatar.identity : 1);
			this.editorTitleInput.value = recipe.title || "";
			this.editorDietOutput.value = DIET[recipe.diet || "VEGAN"];
			this.editorCategorySelector.value = recipe.category || "MAIN_COURSE";
			this.editorDescriptionArea.value = recipe.description || "";
			this.editorInstructionArea.value = recipe.instruction || "";

			if (recipe.identity) {
				this.displayRecipeIngredients(recipe);
				this.displayRecipeIllustrations(recipe);
			} else {
				this.editorIngredientsDivision.classList.add("hidden");
				this.editorIllustrationsDivision.classList.add("hidden");
			}

			this.messageOutput.value = "";
		} catch (error) {
			this.messageOutput.value = error.message || error.toString();
			console.error(error);
		}
	}


	/**
	 * Queries the given recipe's ingredients, and populates the associated table.
	 * @param recipe the Recipe
	 * @return { Promise } an execution promise
	 */
	async displayRecipeIngredients (recipe) {
		const ingredients = await this.#invokeQueryRecipeIngredients(recipe);

		this.editorIngredientsTableBody.innerHTML = "";
		for (const ingredient of ingredients) {
			const tableRow = this.editorIngredientRowTemplate.content.firstElementChild.cloneNode(true);
			this.editorIngredientsTableBody.append(tableRow);

			tableRow.querySelector("td.action>button.submit").addEventListener("click", event => this.processSubmitIngredient(recipe, ingredient));
			tableRow.querySelector("td.action>button.remove").addEventListener("click", event => this.processDeleteIngredient(recipe, ingredient));

			const unitSelector = tableRow.querySelector("td.unit>select");
			unitSelector.value = ingredient.unit || "PIECE";
			unitSelector.addEventListener("change", event => ingredient.unit = event.target.value);

			const amountInput = tableRow.querySelector("td.amount>input");
			amountInput.value = ingredient.amount.toString();
			amountInput.addEventListener("change", event => ingredient.amount = window.parseFloat(event.target.value.replace(",", ".")));

			const editorAvatarViewer = tableRow.querySelector("td.avatar>img");
			editorAvatarViewer.src = this.sharedProperties["service-origin"] + "/services/documents/" + ingredient.victual.avatar.identity;

			const editorDietOutput = tableRow.querySelector("td.diet>output");
			editorDietOutput.value = DIET[ingredient.victual.diet || "VEGAN"];

			const aliasSelector = tableRow.querySelector("td.alias>select");
			for (const victual of this.#victuals) {
				const aliasOption = document.createElement("option");
				aliasOption.value = victual.identity.toString();
				aliasOption.innerText = victual.alias;
				aliasSelector.append(aliasOption);
			}

			aliasSelector.value = ingredient.victual.identity.toString();
			aliasSelector.addEventListener("change", event => this.processChangeIngredientVictual(tableRow, ingredient, event.target.value));
		}
	}


	/**
	 * Queries the given recipe's illustrations, and repopulates the associated table.
	 * @param recipe the Recipe
	 * @return { Promise } an execution promise
	 */
	async displayRecipeIllustrations (recipe) {
		const illustrations = await this.#invokeQueryRecipeIllustrations(recipe);

		this.editorIllustrationsTableBody.innerHTML = "";
		for (const illustration of illustrations) {
			const tableRow = this.editorIllustrationRowTemplate.content.firstElementChild.cloneNode(true);
			this.editorIllustrationsTableBody.append(tableRow);

			const anchor = tableRow.querySelector("td.content>a");
			anchor.href = this.sharedProperties["service-origin"] + "/services/documents/" + illustration.identity;
			anchor.innerText = illustration.description || illustration.type;
			tableRow.querySelector("td.size").innerText = illustration.size.toString();
			tableRow.querySelector("td.action>button.remove").addEventListener("click", event => this.processRemoveIllustration(recipe, illustration));
		}
	}


	/**
	 * Performs validating an avatar transfer attempt.
	 * @param dataTransfer the avatar transfer
	 */
	async validateAvatarTransfer (dataTransfer) {
		const primaryItem = dataTransfer.items[0];
		dataTransfer.dropEffect = primaryItem.kind === "file" && primaryItem.type && primaryItem.type.startsWith("image/") ? "copy" : "none";
	}


	/**
	 * Performs submitting the recipe avatar.
	 * @param recipe the recipe
	 * @param avatarFile the avatar image file
	 */
	async processSubmitAvatar (recipe, avatarFile) {
		try {
			if (!recipe.avatar) recipe.avatar = {};
			recipe.avatar.identity = await this.#invokeInsertOrUpdateDocument(avatarFile);
			this.editorAvatarViewer.src = this.sharedProperties["service-origin"] + "/services/documents/" + recipe.avatar.identity;

			this.messageOutput.value = "ok.";
		} catch (error) {
			this.messageOutput.value = error.message || error.toString();
			console.error(error);
		}
	}


	/**
	 * Submits the given recipe.
	 * @param recipe the recipe
	 */
	async processSubmitRecipe (recipe) {
		try {
			recipe.category = this.editorCategorySelector.value.trim() || null;
			recipe.title = this.editorTitleInput.value.trim() || null;
			recipe.description = this.editorDescriptionArea.value.trim() || null;
			recipe.instruction = this.editorInstructionArea.value.trim() || null;

			recipe.identity = await this.#invokeInsertOrUpdateRecipe(recipe);
			recipe.version = (recipe.version || 0) + 1;
			this.editorIngredientsDivision.classList.remove("hidden");
			this.editorIllustrationsDivision.classList.remove("hidden");

			this.messageOutput.value = "ok.";
		} catch (error) {
			this.messageOutput.value = error.message || error.toString();
			console.error(error);
		}
	}


	/**
	 * Removes the given recipe.
	 * @param recipe the recipe
	 */
	async processDeleteRecipe (recipe) {
		try {
			if (recipe.identity)
				await this.#invokeDeleteRecipe(recipe);

			this.messageOutput.value = "ok.";
			this.editorCancelButton.click();
		} catch (error) {
			this.messageOutput.value = error.message || error.toString();
			console.error(error);
		}
	}


	/**
	 * Removes the editor section and re-displays the root section.
	 */
	async processCancel () {
		this.editorSection.remove();
		await this.displayEditableRecipes();
		this.viewsSection.classList.remove("hidden");
	}


	/**
	 * Changes an ingredient's victual.
	 * @param ingredientRow the ingredient's row element
	 * @param ingredient the ingredient
	 * @param victualIdentity the victual identity
	 */
	async processChangeIngredientVictual (ingredientRow, ingredient, victualIdentity) {
		const victual = this.#victuals.find(candidate => candidate.identity == victualIdentity);
		if (!victual) throw new Error("assertion failed!");
		ingredient.victual = victual;

		const editorAvatarViewer = ingredientRow.querySelector("td.avatar>img");
		editorAvatarViewer.src = this.sharedProperties["service-origin"] + "/services/documents/" + ingredient.victual.avatar.identity;

		const editorDietOutput = ingredientRow.querySelector("td.diet>output");
		editorDietOutput.value = DIET[ingredient.victual.diet];
	}


	/**
	 * Submits the given recipe ingredient.
	 * @param recipe the recipe
	 * @param ingredient the recipe ingredient, or a new object for none
	 */
	async processSubmitIngredient (recipe, ingredient = {}) {
		try {
			if (!ingredient.victual) ingredient.victual = this.#victuals[0];
			await this.#invokeInsertOrUpdateIngredient(recipe, ingredient);

			this.messageOutput.value = "ok.";
			return this.displayRecipeIngredients(recipe);
		} catch (error) {
			this.messageOutput.value = error.message || error.toString();
			console.error(error);
		}
	}


	/**
	 * Removes the given recipe ingredient.
	 * @param recipe the recipe
	 * @param ingredient the recipe ingredient
	 */
	async processDeleteIngredient (recipe, ingredient) {
		try {
			if (ingredient.identity)
				await this.#invokeDeleteIngredient(recipe, ingredient);

			this.messageOutput.value = "ok.";
			return this.displayRecipeIngredients(recipe);
		} catch (error) {
			this.messageOutput.value = error.message || error.toString();
			console.error(error);
		}
	}


	/**
	 * Performs validating an illustration transfer attempt.
	 * @param dataTransfer the illustration transfer
	 */
	async validateIllustrationTransfer (dataTransfer) {
		const items = Array.from(dataTransfer.items).filter(item => item.kind === "file" && item.type && item.type !== "application/json");
		dataTransfer.dropEffect = items.length > 0 ? "copy" : "none";
	}


	/**
	 * Performs adding associations of the given recipe to the given illustrations.
	 * @param recipe the recipe
	 * @param illustrationFiles the illustration files
	 */
	async processAddIllustrations (recipe, illustrationFiles) {
		try {
			for (const file of illustrationFiles) {
				if (!file.type || file.type === "application/json") continue;

				const illustrationIdentity = await this.#invokeInsertOrUpdateDocument(file);
				const illustration = { identity: illustrationIdentity, type: file.type, description: file.name, size: file.size };
				await this.#invokeAssociateRecipeWithIllustration(recipe, illustration);
			}

			this.messageOutput.value = "ok.";
			return this.displayRecipeIllustrations(recipe);
		} catch (error) {
			this.messageOutput.value = error.message || error.toString();
			console.error(error);
		}
	}


	/**
	 * Performs removing the association of the given recipe to the given illustration.
	 * @param recipe the recipe
	 * @param illustration the illustration
	 */
	async processRemoveIllustration (recipe, illustration) {
		try {
			await this.#invokeDisassociateRecipeFromIllustration(recipe, illustration);
			this.messageOutput.value = "ok.";
			return this.displayRecipeIllustrations(recipe);
		} catch (error) {
			this.messageOutput.value = error.message || error.toString();
			console.error(error);
		}
	}


	/**
	 * Remotely invokes the web-service method with HTTP signature
	 * GET /services/victuals - application/json,
	 * and returns a promise for the resulting victuals.
	 * @return a promise for the resulting victuals
	 * @throws if the TCP connection to the web-service cannot be established, 
	 *			or if the HTTP response is not ok
	 */
	async #invokeQueryAllVictuals () {
		const resource = this.sharedProperties["service-origin"] + "/services/victuals";
		const headers = { "Accept": "application/json" };
		const response = await fetch(resource, { method: "GET" , headers: headers, credentials: "include" });
		if (!response.ok) throw new Error("HTTP " + response.status + " " + response.statusText);
		return response.json();
	}


	/**
	 * Remotely invokes the web-service method with HTTP signature GET
	 * /services/victuals (ADMIN) or /services/people/{id}/victuals (USER)
	 * - application/json, and returns a promise for the resulting recipes.
	 * @return a promise for the resulting recipes
	 * @throws if the TCP connection to the web-service cannot be established, 
	 *			or if the HTTP response is not ok
	 */
	async #invokeQueryEditableRecipes () {
		const sessionOwner = this.sharedProperties["session-owner"];
		const path = sessionOwner.group === "ADMIN" ? "recipes" : "people/" + sessionOwner.identity + "/recipes";

		const resource = this.sharedProperties["service-origin"] + "/services/" + path;
		const headers = { "Accept": "application/json" };
		const response = await fetch(resource, { method: "GET" , headers: headers, credentials: "include" });
		if (!response.ok) throw new Error("HTTP " + response.status + " " + response.statusText);
		return response.json();
	}


	/**
	 * Remotely invokes the web-service method with HTTP signature
	 * GET /services/recipes/{id}/ingredients - application/json,
	 * and returns a promise for the resulting recipe ingredients.
	 * @param recipe the recipe
	 * @return a promise for the resulting recipe ingredients
	 * @throws if the TCP connection to the web-service cannot be established, 
	 *			or if the HTTP response is not ok
	 */
	async #invokeQueryRecipeIngredients (recipe) {
		const resource = this.sharedProperties["service-origin"] + "/services/recipes/" + recipe.identity + "/ingredients";
		const response = await fetch(resource, { method: "GET" , headers: { "Accept": "application/json" }, credentials: "include" });
		if (!response.ok) throw new Error("HTTP " + response.status + " " + response.statusText);
		return response.json();
	}


	/**
	 * Remotely invokes the web-service method with HTTP signature
	 * GET /services/recipes/{id}/illustrations - application/json,
	 * and returns a promise for the resulting recipe illustrations.
	 * @param recipe the recipe
	 * @return a promise for the resulting recipe illustrations
	 * @throws if the TCP connection to the web-service cannot be established, 
	 *			or if the HTTP response is not ok
	 */
	async #invokeQueryRecipeIllustrations (recipe) {
		const resource = this.sharedProperties["service-origin"] + "/services/recipes/" + recipe.identity + "/illustrations";
		const response = await fetch(resource, { method: "GET" , headers: { "Accept": "application/json" }, credentials: "include" });
		if (!response.ok) throw new Error("HTTP " + response.status + " " + response.statusText);
		return response.json();
	}


	/**
	 * Remotely invokes the web-service method with HTTP signature
	 * POST /services/recipes application/json text/plain,
	 * and returns a promise for the identity of the modified recipe.
	 * @param recipe the recipe
	 * @return a promise for the identity of the modified recipe
	 * @throws if the TCP connection to the web-service cannot be established, 
	 *			or if the HTTP response is not ok
	 */
	async #invokeInsertOrUpdateRecipe (recipe) {
		const resource = this.sharedProperties["service-origin"] + "/services/recipes";
		const headers = { "Accept": "text/plain", "Content-Type": "application/json" };
		const response = await fetch(resource, { method: "POST" , headers: headers, body: JSON.stringify(recipe), credentials: "include" });
		if (!response.ok) throw new Error("HTTP " + response.status + " " + response.statusText);
		return window.parseInt(await response.text());
	}


	/**
	 * Remotely invokes the web-service method with HTTP signature
	 * DELETE /services/recipes/{id} - text/plain,
	 * and returns a promise for the identity of the deleted recipe.
	 * @param recipe the recipe
	 * @return a promise for the identity of the deleted recipe
	 * @throws if the TCP connection to the web-service cannot be established, 
	 *			or if the HTTP response is not ok
	 */
	async #invokeDeleteRecipe (recipe) {
		const resource = this.sharedProperties["service-origin"] + "/services/recipes/" + recipe.identity;
		const headers = { "Accept": "text/plain" };
		const response = await fetch(resource, { method: "DELETE" , headers: headers, credentials: "include" });
		if (!response.ok) throw new Error("HTTP " + response.status + " " + response.statusText);
		return window.parseInt(await response.text());
	}


	/**
	 * Remotely invokes the web-service method with HTTP signature
	 * POST /services/recipes/{id}/ingredients application/json text/plain,
	 * and returns a promise for the identity of the modified recipe.
	 * @param recipe the recipe
	 * @return a promise for the identity of the modified recipe
	 * @throws if the TCP connection to the web-service cannot be established, 
	 *			or if the HTTP response is not ok
	 */
	async #invokeInsertOrUpdateIngredient (recipe, ingredient) {
		const resource = this.sharedProperties["service-origin"] + "/services/recipes/" + recipe.identity + "/ingredients";
		const headers = { "Content-Type": "application/json", "Accept": "text/plain" };
		const response = await fetch(resource, {method: "POST", headers: headers, body: JSON.stringify(ingredient), credentials: "include" });
		if (!response.ok) throw new Error("HTTP " + response.status + " " + response.statusText);
		return window.parseInt(await response.text());
	}


	/**
	 * Remotely invokes the web-service method with HTTP signature
	 * DELETE /services/recipes/{id1}/ingredients/{id2} - text/plain,
	 * and returns a promise for the identity of the modified recipe.
	 * @param recipe the recipe
	 * @return a promise for the identity of the modified recipe
	 * @throws if the TCP connection to the web-service cannot be established, 
	 *			or if the HTTP response is not ok
	 */
	async #invokeDeleteIngredient (recipe, ingredient) {
		const resource = this.sharedProperties["service-origin"] + "/services/recipes/" + recipe.identity + "/ingredients/" + ingredient.identity;
		const headers= { "Accept": "text/plain" };
		const response = await fetch(resource, {method: "DELETE", headers: headers, credentials: "include" });
		if (!response.ok) throw new Error("HTTP " + response.status + " " + response.statusText);
		return window.parseInt(await response.text());
	}


	/**
	 * Remotely invokes the web-service method with HTTP signature
	 * PATCH /services/recipes/{id}/illustrations - text/plain,
	 * and returns a promise for the identity of the affected illustration.
	 * @param recipe the recipe
	 * @param illustration the illustration
	 * @return a promise for the identity of the affected illustration
	 * @throws if the TCP connection to the web-service cannot be established, 
	 *			or if the HTTP response is not ok
	 */
	async #invokeAssociateRecipeWithIllustration (recipe, illustration) {
		const resource = this.sharedProperties["service-origin"] + "/services/recipes/" + recipe.identity + "/illustrations/" + illustration.identity;
		const headers = { "Accept": "text/plain" };
		const response = await fetch(resource, { method: "PATCH" , headers: headers, credentials: "include" });
		if (!response.ok) throw new Error("HTTP " + response.status + " " + response.statusText);
		return window.parseInt(await response.text());
	}


	/**
	 * Remotely invokes the web-service method with HTTP signature
	 * DELETE /services/recipes/{id1}/illustrations/{id2} - text/plain,
	 * and returns a promise for the identity of the affected illustration.
	 * @param recipe the recipe
	 * @param illustration the illustration
	 * @return a promise for the identity of the affected illustration
	 * @throws if the TCP connection to the web-service cannot be established, 
	 *			or if the HTTP response is not ok
	 */
	async #invokeDisassociateRecipeFromIllustration (recipe, illustration) {
		const resource = this.sharedProperties["service-origin"] + "/services/recipes/" + recipe.identity + "/illustrations/" + illustration.identity;
		const headers = { "Accept": "text/plain" };
		const response = await fetch(resource, { method: "DELETE" , headers: headers, credentials: "include" });
		if (!response.ok) throw new Error("HTTP " + response.status + " " + response.statusText);
		return window.parseInt(await response.text());
	}


	/**
	 * Remotely invokes the web-service method with HTTP signature
	 * POST /services/documents * text/plain,
	 * and returns a promise for the resulting document's identity.
	 * @param file the file
	 * @return a promise for the resulting document's identity
	 * @throws if the TCP connection to the web-service cannot be established, 
	 *			or if the HTTP response is not ok
	 */
	async #invokeInsertOrUpdateDocument (file) {
		const headers = { "Accept": "text/plain", "Content-Type": file.type, "X-Content-Description": file.name };
		const resource = this.sharedProperties["service-origin"] + "/services/documents";

		const response = await fetch(resource, { method: "POST" , headers: headers, body: file, credentials: "include" });
		if (!response.ok) throw new Error("HTTP " + response.status + " " + response.statusText);
		return window.parseInt(await response.text());
	}


	/**
	 * Creates and returns a button.
	 * @param label the button label, or null for none
	 * @return the button element created
	 */
	static createButton (label = null) {
		const button = document.createElement("button");
		button.type = "button";
		button.innerText = label || "";
		return button;
	}
}


/*
 * Registers an event listener for the browser window's load event.
 */
window.addEventListener("load", event => {
	const controller = new RecipeEditorTabController();
	console.log(controller);
});
