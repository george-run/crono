

//----------------------------------------------
//
// Before you dive into these functions, remember that we've included them in the bundle just for demo purposes
//
//----------------------------------------------

function escapeHtml(unsafe) {
    return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
};

function getTypeOfCode($obj) {
    switch($obj.prop("tagName").toLowerCase()){
        case 'script':
            if ($obj.attr('src')) {
                return 'script-external';
            } else {
                return 'script-same-page';
            }
            break;
        case 'style':
            return 'style-same-page';
            break;
        case 'link':
            return 'style-external';
            break;
        case 'div':
            return 'html-same-page';
            break;
    }
}

function getFormattedCode(htmlContent) {

    var codeLines = escapeHtml(htmlContent).split('\n');

    if (codeLines[0].slice(offset - 1) === '') {
        codeLines.shift();
    }
    var offset = escapeHtml(htmlContent).match(/^\s+/)[0].length;
    return code = codeLines.map(function (line) {
        return line.slice(offset - 1);
    }).join('\n');
}

function getFormattedDependencies(dependencies) {
    var dependenciesArr = dependencies.split(',');
    var createStringOfDependencies = '';
    for (var i = 0; i < dependenciesArr.length; i++) {
        createStringOfDependencies += '[data-dependency-name="' + dependenciesArr[i] + '"],'
    }
    createStringOfDependencies = createStringOfDependencies.slice(0, -1).toString();
    return createStringOfDependencies;
}

function generateDependencyCode($module,$dependency){
    var $moduleParrent = ($module.closest('.code-container')[0] ? $module.closest('.code-container') : $module.parent()) ;
    switch (getTypeOfCode($dependency)) {
        case 'script-external':
            $moduleParrent.find('.js-source code').append('&lt;script src="' + $dependency.attr('src') + '"&gt;&lt;\/script&gt;\n');
            break;
        case 'script-same-page':
            var codeJs = $dependency.html();
            var formattedJs = getFormattedCode(codeJs);
            formattedJs = "&lt;script&gt;\n" + formattedJs + "&lt;/script&gt;\n";
            $moduleParrent.find('.js-source code').append(formattedJs);
            break;
        case 'style-external':
            $moduleParrent.find('.css-source code').append('\n&lt;link rel="stylesheet" href="' + $dependency.attr('href') + '"&gt;');
            break;
        case 'style-same-page':
            var codeStyle = $dependency.html();
            var formattedStyle = getFormattedCode(codeStyle);
            formattedStyle = "\n&lt;style&gt;\n" + formattedStyle + "&lt;/style&gt;\n";
            $moduleParrent.find('.css-source code').append(formattedStyle);
            break;
        case 'html-same-page':
            var codeStyle = $dependency.html();
            var formattedStyle = getFormattedCode(codeStyle);
            formattedStyle = '\n' + formattedStyle + '\n';
            $moduleParrent.find('.html-source code').append(formattedStyle);
            break;
    }
}

function showPageCode() {

    $('[data-showcase="example"]').each(function () {

        var $exampleEl = $(this);
        var example = $exampleEl.html();

        if (example) {
            var formattedHtml = getFormattedCode(example);

            var $moduleParrent = getModuleParrent($exampleEl);
            $moduleParrent.find('.html-source code').append(formattedHtml);
            
            var dependencies = $exampleEl.attr('data-dependencies');
            if (dependencies) {
                $(getFormattedDependencies(dependencies)).each(function () {
                    generateDependencyCode($exampleEl,$(this));
                });
            }
        }
    });
}

function getModuleParrent($htmlExampleEl) {
    return ($htmlExampleEl.closest('.code-container')[0] ? $htmlExampleEl.closest('.code-container') : $htmlExampleEl.parent());
}

function updateSideBarCode(event) {
    var fixedStatus = $('input[name="sidebar_fixed_status"]:checked').val();
    var expandedStatus = $('input[name="sidebar_expanded_status"]:checked').val();
    var sidebarClasses = 'sidebar';
    var controlButtonIconClasses = 'menu-icon fa';

    if (fixedStatus == 'fixed') {
        sidebarClasses += ' sidebar-fixed';
    }

    switch (expandedStatus) {
        case 'expanded' :
            controlButtonIconClasses += ' fa-arrow-left';
            break;
        case 'collapsed' :
            sidebarClasses += ' sidebar-min';
            controlButtonIconClasses += ' fa-arrow-right';
            break;
    }

    var $sidebarClasses = $('#sidebar_code code > span').find('.attr-value').eq(1);
    var $sidebarToggleButtonIcon = $('#sidebar_code code > span').eq(60).find('.attr-value').eq(0);

    //add color
    switch (event.target.value){
        case 'collapsed':
        case 'expanded':
            $sidebarClasses.css({'background':'red'});
            $sidebarToggleButtonIcon.css({'background':'red'});
            break;
        case 'unfixed':
        case 'fixed':
            $sidebarClasses.css({'background':'red'});
            $sidebarToggleButtonIcon.css({'background':'none'});
            break;
    }

    //write text
    $sidebarClasses.contents().eq(2)[0]['data'] = sidebarClasses;
    $sidebarToggleButtonIcon.contents().eq(2)[0]['data'] = controlButtonIconClasses;


}

function updateFooterBarCode() {
    var fixedStatus = $('input[name="footer_fixed_status"]:checked').val();
    switch (fixedStatus) {
        case 'fixed' :
            $('#footer_fixed_code').removeClass('hide');
            $('#footer_unfixed_code').addClass('hide');
            break;
        case 'unfixed' :
            $('#footer_fixed_code').addClass('hide');
            $('#footer_unfixed_code').removeClass('hide');
            break;
    }
}

function demoHelpers() {
    staticNavigation();
    $(window).on('hashchange', function() {
        staticNavigation();
    });
}


