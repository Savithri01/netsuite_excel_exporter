/**
 * @NApiVersion 2.1
 * @NScriptType Restlet
 */
define(['N/search', 'N/log'], (search, log) => {

    function listSavedSearches() {
        try {
            const savedSearchObj = search.create({
                type: "savedsearch",
                filters: [
                ],
                columns: [
                    search.createColumn({ name: "title", label: "Title" }),
                    search.createColumn({ name: "id", label: "ID" }),
                    search.createColumn({ name: "recordtype", label: "Type" }),
                    search.createColumn({ name: "owner", label: "Owner" }),
                    search.createColumn({ name: "access", label: "Access" })
                ]
            });

            const searches = [];
            savedSearchObj.run().each((result) => {
                searches.push({
                    id: result.getValue({ name: "id" }),
                    name: result.getValue({ name: "title" }),
                    type: result.getValue({ name: "recordtype" }),
                    owner: result.getText({ name: "owner" }),
                    access: result.getText({ name: "access" })
                });
                return true;
            });

            return searches;
        } catch (e) {
            return [];
        }
    }

    function getSearchData(searchNames) {
        try {
            const savedSearches = listSavedSearches();
            const results = {};

            // Filter saved searches based on the selected names
            const selectedSearches = savedSearches.filter((searchDetails) =>
                searchNames.includes(searchDetails.name)
            );

            if (selectedSearches.length === 0) {
                throw new Error("No saved searches found for the given names.");
            }

            selectedSearches.forEach((searchDetails) => {
                const searchId = searchDetails.id;
                try {
                    const savedSearch = search.load({ id: searchId });

                    let data = [];
                    const pagedData = savedSearch.runPaged({ pageSize: 1000 });

                    pagedData.pageRanges.forEach((pageRange) => {
                        const page = pagedData.fetch({ index: pageRange.index });
                        page.data.forEach((result) => {
                            data.push(result.getAllValues());
                        });
                    });

                    results[searchDetails.name] = data;
                } catch (error) {
                    log.debug(`Error loading saved search ${searchId}`, error.message);
                }
            });

            return JSON.stringify({
                success: true,
                results: results
            });

        } catch (e) {
            return JSON.stringify({
                success: false,
                error: `getSearchData error: ${e.message}`
            });
        }
    }

    function doGet(params) {
        try {
            log.debug('RESTlet doGet', JSON.stringify(params));
            if (params.action === 'list') {
                return JSON.stringify({
                    success: true,
                    searches: listSavedSearches()
                });
            } else if (params.searchNames) {
                const searchNames = params.searchNames.split(',');
                return getSearchData(searchNames);
            } else {
                throw new Error("Missing 'searchNames' parameter.");
            }
        } catch (e) {
            return JSON.stringify({
                success: false,
                error: e.message
            });
        }
    }

    return {
        get: doGet
    };
});