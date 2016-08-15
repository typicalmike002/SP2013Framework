/**
 * Class: SPcamlQuery
 *
 * SPCamlQuery(listName, query);
 *
 * Params:
 *     - listName(string): Name of the sharepoint document library to query.
 *     - query: The caml query to perform the opperation on.
 *
 * Notes: 
 *     - Make sure sp.js is loaded before using this class.
 */

export class SPCamlQuery {
    
    private query: string;
    private listName: string;
    private onSuccess: Function;
    private collListItem: any;
    private clientContext: any;
  
    constructor(listName: string, query: string){
        this.listName = listName;
        this.query = query;
    };


    /**
     * Method onFail
     *
     * Note:
     *     - Logs error message if getData fails.
     */

    private onFail(sender: any, args: any){
        console.log('The ' + this.listName + ' query failed:\n' + 
            args.get_message() + '\n' + args.get_stackTrace()
        );
    };


    /**
     * Method: getData
     *
     * getData(onSuccess);
     *
     * Params: 
     *     - onSuccess: callback function to execute on success.
     *
     * Note:
     *     - SharePoint requires the callback function as well as
     *       clientContext and collListItem to be referenced by 'this'.
     */

    public getData(onSuccess: Function) {

        // Attaches the callback function to the class:
        this.onSuccess = onSuccess;

        // Sets the clientContext for retrieving list items:
        this.clientContext = SP.ClientContext.get_current();

        // Gets the list from SharePoint:
        let oList: any = this.clientContext.get_web().get_lists().getByTitle(this.listName);

        // Prepares the query to run on the list:
        let spCamlQuery: any = new SP.CamlQuery();
        spCamlQuery.set_viewXml(this.query);
        this.collListItem = oList.getItems(spCamlQuery);
        
        // Executes the query and triggers callback functions:
        this.clientContext.load(this.collListItem);
        this.clientContext.executeQueryAsync(
            Function.createDelegate(this, this.onSuccess),
            Function.createDelegate(this, this.onFail)
        );
    };
};



/**
 * Class: SPajaxQuery
 *
 * SPCamlQuery(listName, fields);
 *
 * Params:
 *     - listName(string): Name of the sharepoint document library to query.
 *     - fields: Array of values to pull from the listName.
 *
 * Notes: 
 *     - Make sure sp.js is loaded before using this class.
 *     - This class depends on the jQuery library.
 */

export class SPajaxQuery {

    private listName: string;
    private fields: string;
    private onSuccess: Function;

    constructor(listName: string, fields: string){
        this.listName = listName;
        this.fields = fields;
    };

    /**
     * Method: onFail(errorMessage)
     *
     * - Logs error message if getData fails.
     */

    private onFail(errorMessage: string){
        console.log('The ' + this.listName + ' query failed: ' + errorMessage);
    };

    /**
     * Method: getData(onSuccess)
     *
     * Params:
     * 
     * - onSuccess: Function to return if ajax returns successfully.
     */

    public getData(onSuccess: Function){

        // Attaches the callback function to the class:
        this.onSuccess = onSuccess;

        jQuery.ajax({
            url: _spPageContextInfo.webAbsoluteUrl + '/_api/web/lists/getByTitle("' + this.listName + '")/items',
            type: 'GET',
            headers: { "accept": "application/json;odata=verbose" },
            success: function(){
                return this.onSuccess();
            },
            error: function(error){
                return this.onFail(error);
            }
        });
    };
};