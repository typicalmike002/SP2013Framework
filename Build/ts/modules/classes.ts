/**
 * Class: SPcamlQuery
 *
 * SPCamlQuery(listName, query);
 *
 * Params:
 *     - listName(string): Name of the sharepoint document library to query.
 *     - query: The caml query to perform the opperation on.
 */

'use strict';

export class SPCamlQuery {

    private query: string;
    private listName: string;
    private onSuccess: Function;
    private collListItem: any;
    private clientContext: any;

    constructor(listName: string, query: any) {
        this.listName = listName;
        this.query = query;
    };

    /**
     * Method: getData
     *
     * getData(onSuccess);
     *
     * Params: 
     *     - onSuccess: callback function to execute on success.
     */

    public getData(onSuccess: Function): void {

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

    /**
     * Private Method onFail
     */

    private onFail(sender: any, args: any): void {
        console.log('The ' + this.listName + ' query failed:\n' +
            args.get_message() + '\n' + args.get_stackTrace()
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
 *     - query: Array of values to pull from the listName.
 *
 * Dependencies: 
 *     - jQuery
 *     - sp.js
 */

export class SPajaxQuery {

    private listName: string;
    private query: string;

    constructor(listName: string, query: string) {
        this.listName = listName;
        this.query = query;
    };

    /**
     * Method: getData(onSuccess)
     *
     * Params:
     * 
     * - onSuccess: Function to return if ajax returns successfully.
     */

    public getData(onSuccess: Function): void {

        // Prepares url string for ajax:
        const restUrl: string = _spPageContextInfo.webAbsoluteUrl
            + "/_api/web/lists/getByTitle('"
            + this.listName
            + "')/items"
            + "?"
            + this.query;

        jQuery.ajax({
            url: restUrl,
            type: 'GET',
            headers: {
                "accept": "application/json;odata=verbose",
                "X-RequestDigest": jQuery('#__REQUESTDIGEST').val(),
            },
            success: (data: Object): void => {
                onSuccess(data);
            },
            error: (error: Object): void => {
                console.log('The SPajaxQuery on: ' + (() => this.listName) + ' list failed:\n' + error);
            },
        });
    };
};




/**
 * SPServicesJsonQuery
 *
 * SPServicesJsonQuery(listName, {...settings})
 *
 * Params:
 *    - listName: String containing the list name to perform a query on.
 *
 *    - settings: Object containing a list of settings:
 *                https://spservices.codeplex.com/wikipage?title=$().SPServices.SPGetListItemsJson
 *
 * Dependencies: 
 *    - jquery
 *    - jquery.SPServices
 */

export class SPServicesJsonQuery {

    private settings: Object;

    constructor(settings: Object) {
        this.settings = settings;
    }

    /**
     * Method: getData(onSuccess)
     *
     * - onSuccess: Function to execute after query is successful.
     */

    public getData(onSuccess: Function): void {

        let requestData: any = jQuery().SPServices.SPGetListItemsJson(this.settings);

        jQuery.when(requestData).done(function(): void {
            onSuccess(this.data);
        }).fail(function(errorThrown: Object): void {
            console.log('The SPServicesJsonQuery on: ' + this.listName + ' list failed.\n' + errorThrown);
        });
    }
}
