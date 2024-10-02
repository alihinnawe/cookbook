import TabController from "../../../tool/tab-controller.js";


/**
 * Skeleton for tab controller type.
 */
class ReceipeEditorTabController extends TabController {


	/**
	 * Initializes a new instance.
	 */
	constructor () {
		super("recipe-editor");

		// register controller event listeners 
		this.addEventListener("activated", event => this.processActivated());
	}


	// HTML element getter operations
	get victualEditorSection () { return this.center.querySelector("section.victual-editor"); }


	/**
	 * Handles that activity has changed from false to true.
	 */
	processActivated () {
		this.messageOutput.value = "";

		// redefine center content
		const template = document.querySelector("head>template.victual-editor");
		while (this.center.lastElementChild) this.center.lastElementChild.remove();
		this.center.append(template.content.firstElementChild.cloneNode(true));

		// register basic event listeners
		// TODO
	}
}


/*
 * Registers an event listener for the browser window's load event.
 */
window.addEventListener("load", event => {
	const controller = new ReceipeEditorTabController();
	console.log(controller);
});
