import TabController from "../../../tool/tab-controller.js";
import {DIET,CATEGORY} from "./enums.js"


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
	get queryTitelInput() { return this.querySection.querySelector("div.criteria>span.left>div.title>input")}
	get queryDescription() { return this.querySection.querySelector("div.criteria>span.left>div.description>input")}
	get queryInstruction() { return this.querySection.querySelector("div.criteria>span.left>div.instruction>input")}
	get queryIngredientCount() { return this.querySection.querySelector("div.criteria>span.left>div.min-ingredient-count>input")}
	get categorySelector() { return this.querySection.querySelector("div.criteria>span.left>div.category>select")}
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

	}
}


/*
 * Registers an event listener for the browser window's load event.
 */
window.addEventListener("load", event => {
	const controller = new RecipeViewTabController();
	console.log(controller);
});