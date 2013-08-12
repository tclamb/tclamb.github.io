// -*- coding:utf-8 -*-
var github = (function(){
  function render(target, repos){
    var i = 0, fragment = '', t = $(target)[0];

    for(i = 0; i < repos.length; i++) {
      fragment += '<li><a href="'+repos[i].html_url+'">'+repos[i].full_name+'</a> : '+
        repos[i].description+'</li>';
    }
    t.innerHTML = fragment;
  }
  function renderSources(options, repos){
    var requests = repos.map(function(repo, i){
      return jQuery.ajax({
        url: "https://api.github.com/repos/"+repo.full_name+"?callback=?"
        , dataType: 'json'
        , error: function(err) {
          $(options.target + ' li.loading').addClass('error')
            .text("error");
        }
        , success: function(data) {
          if (!data || !data.data || !data.data.source) { return; }
          repos[i] = data.data.source;
        }
      });
    });
    // Reqwests! doesn't support when() for its promises
    // so revert to using jQuery AJAX requests
    jQuery.when.apply(undefined, requests).then(function(){render(options.target, repos);});
  }
  return {
    showRepos: function(options){
      $.ajax({
        url: "https://api.github.com/users/"+options.user+"/repos?"+
          "type="+options.type+
          "&sort="+options.sort+
          "&direction="+options.direction+
          "&callback=?"
        , type: 'jsonp'
        , error: function (err) {
          $(options.target + ' li.loading').addClass('error')
            .text("error");
        }
        , success: function(data) {
          var repos = [];
          if (!data || !data.data) { return; }
          for (var i = 0; i < options.count; i++) {
            if (!data.data[i]) { return; }
            if (options.skip_forks && data.data[i].fork) { data.data.splice(i--, 1); continue; }
            repos.push(data.data[i]);
          }
          renderSources(options, repos);
          //render(options.target, repos);
        }
      });
    }
  };
})();
