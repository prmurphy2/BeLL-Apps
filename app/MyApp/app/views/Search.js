$(function() {

    App.Views.Search = Backbone.View.extend({

        events: {
            "click #searchR": "searchResult",
            "click #addRestoPub": "addResourceToPublication",
            "click #next_button": function(e) {
                App.startActivityIndicator()
                this.groupresult.skip = this.groupresult.skip + 20;
                this.groupresult.fetch({
                    async: false
                })
                App.stopActivityIndicator()
                var obj = this
                if (this.groupresult.length > 0) {
                    var SearchSpans = new App.Views.SearchSpans({
                        collection: this.groupresult
                    })
                    SearchSpans.resourceids = obj.resourceids
                    SearchSpans.render()
                    $('#srch').html(SearchSpans.el)
                    $("#previous_button").show()

                    if (this.groupresult.length < 20) {
                        $("#next_button").hide();
                    }
                } else {
                    this.groupresult.skip = this.groupresult.skip - 20;
                    $("#next_button").hide();
                }
            },
            "click #previous_button": function(e) {
                App.startActivityIndicator()
                this.groupresult.skip = this.groupresult.skip - 20;
                this.groupresult.fetch({
                    async: false
                })
                App.stopActivityIndicator()
                var obj = this
                if (this.groupresult.length > 0) {
                    var SearchSpans = new App.Views.SearchSpans({
                        collection: this.groupresult
                    })
                    SearchSpans.resourceids = obj.resourceids
                    SearchSpans.render()
                    $('#srch').html(SearchSpans.el)
                    $("#next_button").show()
                } else {
                    $("#previous_button").hide();
                }
                if (this.groupresult.skip <= 0) {
                    $("#previous_button").hide();
                }
            }
        },
        template: $('#template-Search').html(),

        vars: {},
        groupresult: null,
        resultArray: null,

        initialize: function() {
            //this.groupresult = new App.Collections.SearchResource()
            this.groupresult = new App.Collections.Resources()
            this.resultArray = []
            enablenext = 0
        },
        render: function() {
            var obj = this
            var collections = App.collectionslist
            this.vars.tags = collections.toJSON()
            this.vars.addResource = this.addResource
            if (typeof this.Publications != 'undefined') {

                this.vars.Publications = this.Publications
            } else {
                this.vars.Publications = false
            }
            this.$el.html(_.template(this.template, this.vars))
            if (searchText != "" || (this.collectionFilter) || (this.subjectFilter) || (this.levelFilter) || (this.languageFilter) || (this.mediumFilter) || (this.ratingFilter && this.ratingFilter.length > 0)) {
                App.startActivityIndicator()
                this.getSearchedRecords();
            }
        },
        getSearchedRecords: function() {
            var mapFilter = {};
            var filters = new Array()
            if (this.collectionFilter && searchText.replace(" ", "") == '' && !(this.subjectFilter)) {
                for (var i = 0; i < this.collectionFilter.length; i++) {
                    filters.push(this.collectionFilter[i])
                }
            }
            else {
                if (this.collectionFilter && (searchText.replace(" ", "") != '' || this.subjectFilter)){
                    mapFilter["Tag"] = this.collectionFilter;
                }
            }
            if (this.subjectFilter) {
                for (var i = 0; i < this.subjectFilter.length; i++) {
                    filters.push(this.subjectFilter[i])
                }
            }
            if (this.levelFilter && !(this.languageFilter) && searchText.replace(" ", "") == '' && !(this.subjectFilter) && !(this.collectionFilter)) {
                for (var i = 0; i < this.levelFilter.length; i++) {
                    filters.push(this.levelFilter[i].toLowerCase())
                }
            }
            else {
                if (this.levelFilter && (this.languageFilter || searchText.replace(" ", "") != '' || this.subjectFilter || this.collectionFilter)){
                    mapFilter["Level"] = this.levelFilter;
                }
            }
            if (this.mediumFilter) {
                for (var i = 0; i < this.mediumFilter.length; i++) {
                    filters.push(this.mediumFilter[i])
                }
            }
            if (this.languageFilter && searchText.replace(" ", "") == '') {
                for (var i = 0; i < this.languageFilter.length; i++) {
                    filters.push(this.languageFilter[i])
                }
            }
            if (this.ratingFilter) {
                for (var i = 0; i < this.ratingFilter.length; i++) {
                    filters.push(parseInt(this.ratingFilter[i]))
                }
            }
            var prefix, temp_filters, temp_prefix;
            if (searchText != '') {
                // var prefix = searchText.replace(/[!(.,;):&]+/gi, "").toLowerCase().split(" ")
                prefix = searchText.replace(/[!(.,;):&]+/gi, "").toLowerCase()
                /* Get Collection Id from collection list database by passing the name of collection*/
                $.ajax({
                    url: '/collectionlist/_design/bell/_view/collectionByName?_include_docs=true&key="' + prefix + '"',
                    type: 'GET',
                    dataType: 'json',
                    success: function(collResult) {
                        console.log(collResult);
                        if (collResult.rows.length > 0) {
                            filters.push(collResult.rows[0].id);
                            // console.log(id);
                        }
                    },
                    error: function() {
                        alert("Unable to get collections.");

                    },
                    async: false
                });
                /////////////////////////////////////////////////////
                /* for (var idx in prefix) {
                 if (prefix[idx] != ' ' && prefix[idx] != "" && prefix[idx] != "the" && prefix[idx] != "an" && prefix[idx] != "a")
                 filters.push(prefix[idx])
                 }*/
            }
            filters.push(prefix) /*Push keyword to the filters*/
            var fil = JSON.stringify(filters);
            console.log(fil)
            this.groupresult.skip = 0
            this.groupresult.collectionName = fil;
            this.groupresult.fetch({
                async: false
            })
            //Checking the AND Conditions here
            //Waqas
            var resultModels;
            if(mapFilter != null) {
                if (this.groupresult.models.length > 0 && mapFilter != {}) {
                    /*var language = mapFilter["language"];
                     var models = [];
                     for (var i = 0; i < this.groupresult.models.length; i++) {
                     var tempRes = this.groupresult.models[i];
                     if (tempRes.attributes.language == language) {
                     models.push(tempRes);
                     }
                     }
                     this.groupresult.models = models;
                     if (models.length == 0) {
                     this.groupresult.length = 0;
                     }*/
                    var tempResultModels = this.groupresult.models;
                    resultModels = this.checkANDConditions(mapFilter , tempResultModels);
                }
            }
            if(resultModels != null) {
                this.groupresult.models = resultModels;
                if(resultModels.length == 0) {
                    this.groupresult.length = 0;
                } else {
                    this.groupresult.length = resultModels.length;
                }
            }
            //End of the checking AND Conditions here
            App.stopActivityIndicator()
            var obj = this
            if (obj.addResource == true) {
                if (this.groupresult.length > 0) {
                    var SearchSpans = new App.Views.SearchSpans({
                        collection: this.groupresult
                    })

                    SearchSpans.resourceids = obj.resourceids
                    SearchSpans.render()
                    $('#srch').append(SearchSpans.el)

                }
            } else {
                var loggedIn = App.member
                //console.log(App.member)
                //alert('check')
                var roles = loggedIn.get("roles")
                var SearchResult = new App.Views.ResourcesTable({
                    collection: this.groupresult
                })
                SearchResult.removeAlphabet = true
                SearchResult.isManager = roles.indexOf("Manager")
                SearchResult.resourceids = obj.resourceids
                SearchResult.collections = App.collectionslist
                SearchResult.render()
                $('#srch').html('<h4>Search Result <a style="float:right" class="btn btn-info" onclick="backtoSearchView()">Back To Search</a></h4>')
                $('#srch').append(SearchResult.el)
            }

        },
        checkANDConditions: function(map_filter , resultModels) {
            var matchedResults;
            var models = [];
            for(var i = 0 ; i < resultModels.length ; i++) {
                matchedResults = [];
                var model = resultModels[i];
                for (var key in map_filter)
                {
                    var value = map_filter[key];
                    if(Array.isArray(model.attributes[key])){
                        var arrayValCheck = false;
                        for(var j = 0 ; j < value.length ; j++) {
                            var val = value[j];
                            if(model.attributes[key].indexOf(val) > -1) {
                                arrayValCheck = true;
                            }
                        }
                        matchedResults.push(arrayValCheck);
                    }
                }
                if(matchedResults.indexOf(false) == -1) {
                    models.push(model);
                }
            }
            return models;
        },
        addResourceToStepView: function() {

            var obj = this
            var ResultCollection = new Backbone.Collection();
            if (obj.resultArray.length > 0) {
                ResultCollection.set(obj.resultArray)
                var SearchSpans = new App.Views.SearchSpans({
                    collection: ResultCollection
                })

                SearchSpans.resourceids = obj.resourceids
                SearchSpans.render()
                $('#srch').append(SearchSpans.el)

            }

        },
        searchResult: function() {
            searchText = $("#searchText").val()
            var collectionFilter = new Array()
            var subjectFilter = new Array()
            var levelFilter = new Array()
            ratingFilter.length = 0

            collectionFilter = $("#multiselect-collections-search").val()
            subjectFilter = $("#multiselect-subject-search").val()
            levelFilter = $("#multiselect-levels-search").val()
            mediumFilter = $('#multiselect-medium-search').val()

            $("input[name='star']").each(function() {
                if ($(this).is(":checked")) {
                    ratingFilter.push($(this).val());
                }
            })

            if (searchText != "" || (collectionFilter) || (subjectFilter) || (levelFilter) || (mediumFilter) || (ratingFilter && ratingFilter.length > 0)) {

                this.collectionFilter = collectionFilter
                this.levelFilter = levelFilter
                this.subjectFilter = subjectFilter
                this.ratingFilter = ratingFilter
                this.mediumFilter = mediumFilter
                this.addResource = true
                App.$el.children('.body').html(search.el)
                this.render()
                $("#searchText2").val(searchText)
                $("#srch").show()
                $(".row").hide()
                $(".search-bottom-nav").show()
                $(".search-result-header").show()
                $("#selectAllButton").show()
            }
            $('#previous_button').hide()
            $('#searchText').focus();
            $("#searchText").val(searchText)

        },
        addResourceToPublication: function() {
            if (typeof grpId === 'undefined') {
                document.location.href = '../nation/index.html#publication'
            }
            var rids = new Array()
            var publication = new App.Models.Publication({
                "_id": grpId
            })
            publication.fetch({
                async: false
            })
            $("input[name='result']").each(function() {
                if ($(this).is(":checked")) {
                    var rId = $(this).val();
                    if (publication.get("resources") != null) {
                        rids = publication.get("resources")
                        if (rids.indexOf(rId) < 0)
                            rids.push(rId)
                    } else {
                        rids.push(rId)
                    }

                }
            });
            publication.set("resources", rids)
            publication.save()
            publication.on('sync', function() {
                alert("Your Resources have been added successfully")
                window.location = '../nation/index.html#publicationdetail/' + publication.get('_id')
            })


        }

    })

})