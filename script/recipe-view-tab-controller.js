import TabController from "../../../tool/tab-controller.js";
import {DIET,CATEGORY,UNIT} from "./enums.js"


/**
 * Skeleton for tab controller type.
 */
class RecipeViewTabController extends TabController {


	/**
	 * Initializes a new instance.
	 */
	constructor () {
		super("recipe-view");

		// register controller event listeners 
		this.addEventListener("activated", event => this.processActivated());
	}


	// HTML element getter operations
	get querySection () { return this.center.querySelector("section.recipes-query"); }
	get recipesView () { return this.center.querySelector("section.recipes-view"); }
	get recipeView () { return this.center.querySelector("section.recipe-view"); }

	get queryTitelInput() { return this.querySection.querySelector("div.criteria>span.left>div.title>input"); }
	get queryDescription() { return this.querySection.querySelector("div.criteria>span.left>div.description>input"); }
	get queryInstruction() { return this.querySection.querySelector("div.criteria>span.left>div.instruction>input"); }
	get queryIngredientCount() { return this.querySection.querySelector("div.criteria>span.left>div.min-ingredient-count>input"); }
	get categorySelector() { return this.querySection.querySelector("div.criteria>span.left>div.category>select"); }
	get queryDiets() { return this.querySection.querySelector("div.criteria>span.right>div.diets>select"); }
	get queryAuthorship () { return this.querySection.querySelector("div.criteria>span.right>div.authorship>select"); }
	get recipeViewImage () { return this.recipeView.querySelector("div.data>span.avatar>img"); }
	get recipeViewElement () { return this.recipeView.querySelector("div.ingredients>table>tbody"); }


	/**
	 * Handles that activity has changed from false to true.
	 */
	processActivated () {
		this.messageOutput.value = "";

		// redefine center content
		const template = document.querySelector("head>template.recipes-query");
		while (this.center.lastElementChild) this.center.lastElementChild.remove();
		this.center.append(template.content.firstElementChild.cloneNode(true));

		// register basic event listeners
		// TODO
		const ingredientsFilterButton = this.querySection.querySelector("div.control>button.query");
		ingredientsFilterButton.addEventListener("click", event =>  this.processDisplayIngredientsEditor())
	}
	
	
	async processDisplayIngredientsEditor () {
		this.messageOutput.value = "";

		try {
			const template = document.querySelector("head>template.recipes-view");
			this.center.append(template.content.firstElementChild.cloneNode(true));

			const title = this.queryTitelInput.value.trim() || null;
			const description = this.queryDescription.value.trim() || null;
			const ingredientCount = window.parseInt(this.queryIngredientCount.value || "0");
			const instruction = this.queryInstruction.value.trim() || null;
			const diets = Array.from(this.queryDiets.selectedOptions).map(option => option.value);
			const authorship = this.queryAuthorship.value.trim() || null;
			const authored = authorship === null ? null : authorship === "HAS_AUTHOR";
			const category = this.categorySelector.value.trim() || null;

			const recipes = await this.#invokeQueryAllRecipes(title, description, instruction, ingredientCount, category, diets, authored);
			console.log("recipes:",recipes);

			const template1 = document.querySelector("head>template.recipes-view-row");
			const recipesTable = this.recipesView.querySelector("table>tbody");
			recipesTable.innerHTML = "";

			for (const recipe of recipes) {
				this.messageOutput.value = "";
				const tableRow = template1.content.firstElementChild.cloneNode(true);
				// Find elements in the current cloned row
				const buttonImage = tableRow.querySelector("td.access>button>img");
				const title = tableRow.querySelector("td.title");
				const diet = tableRow.querySelector("td.diet");
				const category = tableRow.querySelector("td.category");
				const ingredient = tableRow.querySelector("td.ingredient-count");
				const modified = tableRow.querySelector("td.modified");
				
				buttonImage.src = this.sharedProperties["service-origin"] + "/services/documents/" + recipe.avatar.identity;
				title.innerText = recipe.title || "";
				diet.innerText = DIET[recipe.diet] || "";
				category.innerText = CATEGORY[recipe.category] || "";
				ingredient.innerText = recipe.ingredientCount.toString();
				modified.innerText = new Date(recipe.modified).toLocaleDateString();
				console.log("table rowww view ",tableRow);
				recipesTable.append(tableRow);

				buttonImage.addEventListener("click", event =>  this.processDisplayIngredientEditor(recipe))
			};
			
			// remember to parse authored to the webservice call; NOT authorship.
		} catch (error) {
			console.error(error);
			this.messageOutput.value = error.message || "something went wrong!";
		}
	}


	async #invokeQueryAllRecipes (title, description, instruction, ingredientCount, category, diets, authored) {
		const queryFactory = new URLSearchParams();
		for (const diet of diets) queryFactory.append("diet", diet); 
		if (authored != null) queryFactory.set("authored", authored);
		if (title) queryFactory.set("title-fragment", title);
		if (description) queryFactory.set("description-fragment", description);
		if (instruction) queryFactory.set("instruction-fragment", instruction);
		queryFactory.set("min-ingredient-count", ingredientCount);
		if (category) queryFactory.set("category", category);
		console.log("queryFactory",queryFactory.toString());

		const resource = this.sharedProperties["service-origin"] + "/services/recipes?" + queryFactory.toString();
		const headers = { "Accept": "application/json" };

		const response = await fetch(resource, { method: "GET" , headers: headers, credentials: "include" });
		if (!response.ok) throw new Error("HTTP " + response.status + " " + response.statusText);
		return response.json();
	}

	async processDisplayIngredientEditor (recipe) {
		console.log("test1",recipe);
		this.querySection.classList.add("hidden");
		this.recipesView.classList.add("hidden");

		const templateRecipeView = document.querySelector("head>template.recipe-view");
		const tableRow = this.center.append(templateRecipeView.content.firstElementChild.cloneNode(true));

		const imageAvatar = this.sharedProperties["service-origin"] + "/services/documents/" + recipe.avatar.identity;
		this.recipeViewImage.src = imageAvatar;

		const recipeTitle = this.recipeView.querySelector("div.data>span.other>div.title>input");
		const recipeDiet = this.recipeView.querySelector("div.data>span.other>div.diet>input");
		const recipeCategory = this.recipeView.querySelector("div.data>span.other>div.category>input");
		const recipeDescription = this.recipeView.querySelector("div.description>textarea");
		const recipeInstruction = this.recipeView.querySelector("div.instruction>textarea");

		recipeTitle.value = recipe.title.trim() || null;
		recipeDiet.value = DIET[recipe.diet.trim()] || null;
		recipeCategory.value = CATEGORY[recipe.category.trim()] || null;
		recipeDescription.value = recipe.description.trim() || null;
		recipeInstruction.value = recipe.instruction.trim() || null;

		const recipeIngredients = await this.#invokeQueryRecipeIngredients(recipe);
		const templateRecipeViewRow = document.querySelector("head>template.recipe-view-ingredient-row");
		for (const ingredient of recipeIngredients){
			console.log("ingredient",ingredient);
			const recipeViewRowElement = templateRecipeViewRow.content.firstElementChild.cloneNode(true)

			const buttonImage = recipeViewRowElement.querySelector("td.avatar>img");
			const alias = recipeViewRowElement.querySelector("td.alias.text");
			const diet = recipeViewRowElement.querySelector("td.diet.text");
			const amount = recipeViewRowElement.querySelector("td.amount.number");
			const unit = recipeViewRowElement.querySelector("td.unit.text");
			
			buttonImage.src = this.sharedProperties["service-origin"] + "/services/documents/" + ingredient.victual.avatar.identity;
			alias.innerText = ingredient.victual.alias || "";
			diet.innerText = DIET[ingredient.victual.diet] || ""; 
			amount.innerText = ingredient.amount.toString() || "0";
			unit.innerText = UNIT[ingredient.unit.toString()] || "0";
			this.recipeViewElement.append(recipeViewRowElement);
		}

		const illustrations = await this.#invokeQueryRecipeIllustrations(recipe);
		const illustrationTableBody = this.recipeView.querySelector("div.illustrations>table>tbody");
		const illustrationTemplate =   document.querySelector("head>template.recipe-view-illustration-row");
		for (const illustration of illustrations) {
			const illustrationRowElement = illustrationTemplate.content.firstElementChild.cloneNode(true);
			
			const documentLinkContent = illustrationRowElement.querySelector("td.content.text>a");
			const size = illustrationRowElement.querySelector("td.size.number");
			
			const documentLocation = this.sharedProperties["service-origin"] + "/services/documents/" + illustration.identity;
			documentLinkContent.href = documentLocation || "";
			documentLinkContent.innerText = illustration.description || "";
			size.innerText = illustration.size || ""; 
			illustrationTableBody.append(illustrationRowElement);
		}

		const button = this.recipeView.querySelector("div.control>button.cancel");
		button.addEventListener("click",event => this.processReturnToRecipes());
	}


	async #invokeQueryRecipeIngredients (singleRecipe) {
		const resource = this.sharedProperties["service-origin"] + "/services/recipes/" + singleRecipe.identity + "/ingredients";
		const headers = { "Accept": "application/json" };

		const response = await fetch(resource, { method: "GET" , headers: headers, credentials: "include" });
		if (!response.ok) throw new Error("HTTP " + response.status + " " + response.statusText);
		return response.json();
	}

	
	async #invokeQueryRecipeIllustrations (recipe) {
		const resource = this.sharedProperties["service-origin"] + "/services/recipes/" + recipe.identity + "/illustrations";
		console.log("resourceeeeeeeeee",resource);
		const headers = { "Accept": "application/json" };

		const response = await fetch(resource, { method: "GET" , headers: headers, credentials: "include" });
		if (!response.ok) throw new Error("HTTP " + response.status + " " + response.statusText);
		return response.json();
	}

	async processReturnToRecipes() {

		// Show the Recipes view section
		this.querySection.classList.remove("hidden");
		this.recipesView.classList.remove("hidden");
		this.recipeView.remove();

	}
}


/*
 * Registers an event listener for the browser window's load event.
 */
window.addEventListener("load", event => {
	const controller = new RecipeViewTabController();
	console.log(controller);
});