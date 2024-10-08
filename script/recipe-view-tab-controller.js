import TabController from "../../../tool/tab-controller.js";


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

	get queryTitel() { return this.querySection.querySelector("div.criteria>span.left>div.title")}
	get queryDescription() { return this.querySection.querySelector("div.criteria>span.left>div.description")}
	get queryInstruction() { return this.querySection.querySelector("div.criteria>span.left>div.instruction")}
	get queryIngredientCount() { return this.querySection.querySelector("div.criteria>span.left>div.min-ingredient-count")}
	get category() { return this.querySection.querySelector("div.criteria>span.left>div.category")}
	get queryDiets() { return this.querySection.querySelector("div.criteria>span.right>div.diets>select")}
	get queryAuthorship() { return this.querySection.querySelector("div.criteria>span.right>div.authorship>select")}

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
			const title = this.queryTitel.value || "";
			const description = this.queryDescription || "";
			const ingredientCount = window.parseInt(this.queryIngredientCount || "0");
			const instruction = this.queryInstruction || null;
			const diets = Array.from(this.queryDiets.selectedOptions).map(option => option.value);
			const authorship = this.queryAuthorship.value || null;
			const authored = authorship === null ? null : authorship === "HAS_AUTHOR";
			
			const recipes = await this.#invokeQueryAllRecipes();
			console.log("recipes", recipes);

			recipes.forEach(recipe => {

			this.queryTitel.value =  recipe.title || "";
			this.queryDescription.value = recipe.description || "";
			this.queryIngredientCount.value = parseInt(recipe.ingredientCount || "0");
			this.queryInstruction.value = recipe.instruction || null;
			this.queryDiets.value = Array.from(recipe.selectedOptions).map(option => option.value);
			this.queryAuthorship.value = recipe.authorReference || null;
			this.category.value = recipe.category  || null;
			});
			// remember to parse authored to the webservice call; NOT authorship.
		} catch (error) {
			console.error(error);
			messageOutput.value = error.message || "something went wrong!";
		}
	}

	async #invokeQueryAllRecipes() {
		const resource = this.sharedProperties["service-origin"] + "/services/recipes";
		const headers = { "Accept": "application/json" };
		const response = await fetch(resource, { method: "GET" , headers: headers, credentials: "include" });
		if (!response.ok) throw new Error("HTTP " + response.status + " " + response.statusText);
		return response.json();
	}
}


/*
 * Registers an event listener for the browser window's load event.
 */
window.addEventListener("load", event => {
	const controller = new RecipeViewTabController();
	console.log(controller);
});
