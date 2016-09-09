// For an introduction to the Blank template, see the following documentation:
// http://go.microsoft.com/fwlink/?LinkID=397704
// To debug code on page load in Ripple or on Android devices/emulators: launch your app, set breakpoints, 
// and then run "window.location.reload()" in the JavaScript Console.
(function () {
    "use strict";

    document.addEventListener( 'deviceready', onDeviceReady.bind( this ), false );

    function onDeviceReady()
    {
        // Handle the Cordova pause and resume events
        document.addEventListener( 'pause', onPause.bind( this ), false );
        document.addEventListener('resume', onResume.bind(this), false);
        document.addEventListener("backbutton", onBackKeyDown, false);
        window.addEventListener("resize", window_resize, false);
        
        //проверяем необходимо ли делать редирект на страницу авторизации
        if (($.cookie('user') == '') || ($.cookie('user') == undefined) || ($.cookie('user') == 'null'))
        {
            var pos = window.location.pathname.indexOf('login.html');
            if ((pos === false)||(pos == -1))
            {
                document.location.href = 'login.html';
            }
            else
            {
                document.getElementById("button_auth_script").addEventListener("click", clickAuth);
            }
        }
        else
        {
            var user = $.cookie('user');
            var PermissionGroup_ID = $.cookie('PermissionGroup_ID');
            var PermissionGroup_Name = "";

            $('.nameClient').html(user);

            if (PermissionGroup_ID == "1") {
                PermissionGroup_Name = "Администратор";
            }
            else if (PermissionGroup_ID == "2") {
                PermissionGroup_Name = "Внешний пользователь";
            }
            else if (PermissionGroup_ID == "3") {
                PermissionGroup_Name = "Псевдопользователь";
            }
            else if (PermissionGroup_ID == "5") {
                PermissionGroup_Name = "Оптовый пользователь";
            }
            else if (PermissionGroup_ID == "6") {
                PermissionGroup_Name = "Розничный пользователь";
            }
            else if (PermissionGroup_ID == "8") {
                PermissionGroup_Name = "Менеджер";
            }
            $('.login').html($.cookie('user') + ', ' + PermissionGroup_Name);
            $('.email').html($.cookie('Email'));
            // заполняем мини корзину

            document.getElementById("a_view_index").addEventListener("click", view_index);
            document.getElementById("a_view_catalog").addEventListener("click", view_catalog);
            document.getElementById("a_view_akcii").addEventListener("click", view_akcii);
            document.getElementById("a_view_goods_discounted").addEventListener("click", view_goods_discounted);
            document.getElementById("a_view_live").addEventListener("click", view_live);
            document.getElementById("a_view_contacts").addEventListener("click", view_contacts);
            document.getElementById("a_exit").addEventListener("click", exit);
            document.getElementById("a_view_about").addEventListener("click", view_about);
            document.getElementById("a_view_form_message").addEventListener("click", view_form_message);
            document.getElementById("send_message").addEventListener("click", send_message);
            document.getElementById("a_view_cart").addEventListener("click", view_cart);
            document.getElementById("send_order").addEventListener("click", send_order);
            document.getElementById("go_to_cart").addEventListener("click", view_cart);
            document.getElementById("search_text").addEventListener("oninput", function ()
            {
                waitStart();
                clearTimeout(timerId);
                var timerId = setTimeout(function ()
                {
                    view_search();
                }, 1000);
                
            });
            document.getElementById("search_text").addEventListener("input", function ()
            {
                waitStart();
                clearTimeout(timerId);
                var timerId = setTimeout(function () {
                    view_search();
                }, 1000);
            });

            view_index();
            cart_min();
        }
    };

    function onPause() {
        // TODO: This application has been suspended. Save application state here.
    };

    function onResume() {
        // TODO: This application has been reactivated. Restore application state here.
    };

    function waitStart() { $('#download_polosa').show(); };
    function waitEnd() { $('#download_polosa').hide(); };

    function clickAuth()
    {
        waitStart();
        var Login = $('#FormAuth').find('#login').val();
        var Password = $('#FormAuth').find('#password').val();
        var error = 0;
        var parent_login = $('#FormAuth').find('#login').parent();
        var parent_password = $('#FormAuth').find('#password').parent();
        if (Login == '') {
            $(parent_login).find('label').css('color', 'red');
            error = error + 1;
        }
        else {
            $(parent_login).find('label').attr('style', '');
        }
        if (Password == '') {
            $(parent_password).find('label').css('color', 'red');
            error = error + 1;
        }
        else {
            $(parent_password).find('label').attr('style', '');
        }
        if (error == 0)
        {
            var url = 'http://blokartopt.ru/api/?action=auth&Login=' + Login + '&Password=' + Password;
            $.get(url, function (data)
            {
                if ((data == "0") || (data == 0))
                {
                    dialog_show('dialog_error_auth');
                }
                else
                {
                    var obj = jQuery.parseJSON(data);
                    $.cookie('user', obj.Login);
                    $.cookie('User_ID', obj.User_ID);
                    $.cookie('PermissionGroup_ID', obj.PermissionGroup_ID);
                    $.cookie('Email', obj.Email);
                    document.location.href = 'index.html';
                }
            }).fail(function () { dialog_show('dialog_no_ethernet'); });
        }
        waitEnd();
        return false;
    };

    /*Эта функция просто перезагружает страницу*/
    function reload_page()
    {
        location.reload();
    }

    /*Функция показывает контент главной страницы*/
    function view_index()
    {
        waitStart();
        HideAllShowOne('index');
        HideInputSearch()

        var url = 'http://blokartopt.ru/api/?action=index';
        var html = '';

        $.get(url, function (data)
        {
            html = '<div class="mdl-grid">' + data + '</div>';
            $('.index').html(html);
            waitEnd();
        }).fail(function () { dialog_show('dialog_no_ethernet'); });
    }

    function view_about()
    {
        waitStart();
        HideAllShowOne('about');
        HideInputSearch()

        var url = 'http://blokartopt.ru/api/?action=about';
        var html = '';

        $.get(url, function (data) {
            html = html + '<div class="mdl-grid"><div class="mdl-cell mdl-cell--12-col"><h4>О программе</h4>' + data + '</div></div>';
            $('.about').html(html);
            waitEnd();
        }).fail(function () { dialog_show('dialog_no_ethernet'); });
    }

    /*Функция показывает содержимое каталога (разделы и товары)
    Или информацию о товаре если передан номер товара
    Функция прячет все страничные блоки и показывает только блок "catalog"*/
    function view_catalog(sub, page)
    {
        waitStart();
        HideAllShowOne('catalog');
        HideInputSearch()

        sub = parseInt(sub);
        if ((sub == 0)||(isNaN(sub) == true))
        {
            sub = 27170;
        }

        if ((sub == 0) || (isNaN(sub) == true) || page == undefined)
        {
            var page = 1;
        }
        var user = $.cookie('User_ID');
        var url = 'http://blokartopt.ru/api/?action=subdivisions&sub=' + sub;
        var html = '';
        $('.catalog').html('');
        $.getJSON(url, function (data)
        {
            if ((data.parent != '') && (data.parent != undefined))
            {
                if (page > 1)
                {
                    $('#functionBack').attr('f', 'view_catalog').attr('s', sub).attr('p', page-1);
                }
                else
                {
                    $('#functionBack').attr('f', 'view_catalog').attr('s', data.parent).attr('p', 1);
                }
            }
            else
            {
                $('#functionBack').attr('f', 'view_index').attr('s', '').attr('p', '');
            }

            html = html + '<div class="mdl-grid">';
            html = html + '<div class="mdl-cell mdl-cell--12-col"><h4>' + data.sub_name + '</h4></div>';
            html = html + '</div>';
            if (data.sub != undefined)
            {
                html = html + '<div class="mdl-grid">';
                data.sub.forEach(function (item, i, arr)
                {
                    html = html + '<div class="mdl-cell mdl-cell--4-col mdl-card mdl-shadow--2dp mdl-sub-click" id="catalog_' + arr[i].Subdivision_ID + '">';
                    html = html + '<div class="mdl-img-sub"><img src="' + arr[i].img + '"></div>';
                    html = html + '<div class="mdl-card__supporting-text mdl-card__supporting-text_table">';
                    html = html + '<div class="mdl-card__supporting-text_table_cell">' + arr[i].Subdivision_Name+'</div>';
                    html = html + '</div>';
                    html = html + '</div>';
                });
                html = html + '</div>';
                $('.catalog').html(html);
                data.sub.forEach(function (item, i, arr)
                {
                    document.getElementById("catalog_" + arr[i].Subdivision_ID).addEventListener("click", function () { view_catalog(arr[i].Subdivision_ID, 1);});
                });
                waitEnd();
            }
        }).fail(function () { $('#no_ethernet').show(); });;
        var url = 'http://blokartopt.ru/api/?action=goods&sub=' + sub + '&page=' + page + '&user=' + user;
        $.getJSON(url, function (data)
        {
            if (data.goods != undefined)
            {
                html = html + '<div class="mdl-grid">';
                data.goods.forEach(function (item, i, arr) {
                    html = html + '<div class="mdl-cell mdl-cell--4-col mdl-card mdl-shadow--2dp mdl-sub-click">';
                    html = html + '<div class="mdl-img-sub" id="good_img_' + arr[i].code + '"><img src="' + arr[i].img + '"></div>';
                    html = html + '<div class="mdl_text_good" id="good_text_' + arr[i].code + '">';
                    html = html + arr[i].Name;
                    html = html + '<div class="price_good">Цена: '+arr[i].Price+' руб.</div>';
                    html = html + '<p>Артикул: <b>' + arr[i].code + '</b>';
                    if ((arr[i].StockUnits == 0) || (arr[i].StockUnits == '0') || (arr[i].StockUnits == undefined)) {
                    }
                    else {
                        html = html + ' | <b><span style="color:green;">В наличии</span></b>';
                    }
                    html = html + '</p>';
                    html = html + '</div>';
                        html = html + '<div class="mdl-card__actions mdl-card--border">';

                        if (arr[i].cart == '0') {
                            html = html + '<button class="mdl-button mdl-js-button mdl-button--raised mdl-button--colored" id="button_cart_' + arr[i].code + '"><i class="material-icons">&#xE8CC;</i> В корзину</button>';
                        }
                        else {
                            html = html + '<button class="mdl-button mdl-js-button mdl-button--raised mdl-button--colored" id="button_cart_' + arr[i].code + '"><i class="material-icons">&#xE854;</i> В корзине</button>';
                        }
                        html = html + '<p></p>';
                        if (arr[i].live == '0') {
                            html = html + '<button class="mdl-button mdl-js-button mdl-button--raised mdl-button--colored" id="button_live_' + arr[i].code + '"><i class="material-icons">&#xE87E;</i> Отложить</button>';
                        }
                        else {
                            html = html + '<button class="mdl-button mdl-js-button mdl-button--raised mdl-button--colored" id="button_live_' + arr[i].code + '"><i class="material-icons">&#xE87D;</i> Отложен</button>';
                        }

                            html = html + '</div>';
                    html = html + '</div>';
                });
                html = html + '</div>';
                html = html + pagination(page, data.count_pages, 'view_catalog', 15, sub);
                $('.catalog').html(html);

                data.goods.forEach(function (item, i, arr) {
                    document.getElementById("good_img_" + arr[i].code).addEventListener("click", function () { view_good(arr[i].code, 'view_catalog', page, sub); });
                    document.getElementById("good_text_" + arr[i].code).addEventListener("click", function () { view_good(arr[i].code, 'view_catalog', page, sub); });
                });

                pagination_event(page, data.count_pages, 'view_catalog', 15, sub);
                data.goods.forEach(function (item, i, arr) {
                    document.getElementById("button_cart_" + arr[i].code).addEventListener("click", function () { cartAdd(arr[i].code); });
                    document.getElementById("button_live_" + arr[i].code).addEventListener("click", function () { liveAdd(arr[i].code); });
                });
                waitEnd();
            }
        }).fail(function () { dialog_show('dialog_no_ethernet'); });;
    }

    /*Функция показывает информацию по товару по его коду*/
    function view_good(code, functionName, page, sub)
    {
        $('#functionBack').attr('f', functionName).attr('s', sub).attr('p', page);
        var user = $.cookie('User_ID');
        var url = 'http://blokartopt.ru/api/?action=good&code=' + code + '&user=' + user;
        $.getJSON(url, function (data)
        {
            HideAllShowOne('good');

            var har = '';

            if ((data.Vendor != undefined) && (data.Vendor != '')) {
                har = har + '<p><span style="font-weight:bold;">Производитель: </span> <span style="float: right;">' + data.Vendor + '</span></p>';
            }
            if ((data.d_dim != undefined) && (data.d_dim != '')) {
                har = har + '<p><span style="font-weight:bold;">Диаметр дымохода: </span> <span style="float: right;">' + data.d_dim + '</span></p>';
            }
            if (data.vstroen_bak_t_vod == '1') {
                har = har + '<p><span style="font-weight:bold;">Встроенный бак для горячей воды: </span> <span style="float: right;">Да</span></p>';
            }
            if ((data.v_bak_t_v != undefined) && (data.v_bak_t_v != '')) {
                har = har + '<p><span style="font-weight:bold;">Объем рекомендуемого бака для горячей воды: </span> <span style="float: right;">' + data.v_bak_t_v + '</span></p>';
            }
            if ((data.type_kamen != undefined) && (data.type_kamen != '')) {
                har = har + '<p><span style="font-weight:bold;">Тип каменки: </span> <span style="float: right;">' + data.type_kamen + '</span></p>';
            }
            if ((data.v_kamen != undefined) && (data.v_kamen != '')) {
                har = har + '<p><span style="font-weight:bold;">Объем каменки: </span> <span style="float: right;">' + data.v_kamen + '</span></p>';
            }
            if ((data.gl_top != undefined) && (data.gl_top != '')) {
                har = har + '<p><span style="font-weight:bold;">Глубина топки: </span> <span style="float: right;">' + data.gl_top + '</span></p>';
            }
            if ((data.v_top != undefined) && (data.v_top != '')) {
                har = har + '<p><span style="font-weight:bold;">Объем топки: </span> <span style="float: right;">' + data.v_top + '</span></p>';
            }
            if ((data.m_vis_dim != undefined) && (data.m_vis_dim != '')) {
                har = har + '<p><span style="font-weight:bold;">Минимальная высота дымохода: </span> <span style="float: right;">' + data.m_vis_dim + '</span></p>';
            }
            if ((data.mass != undefined) && (data.mass != '')) {
                har = har + '<p><span style="font-weight:bold;">Масса, кг: </span> <span style="float: right;">' + data.mass + '</span></p>';
            }
            if ((data.Material != undefined) && (data.Material != '')) {
                har = har + '<p><span style="font-weight:bold;">Материал бака: </span> <span style="float: right;">' + data.Material + '</span></p>';
            }
            if ((data.Material_top != undefined) && (data.Material_top != '')) {
                har = har + '<p><span style="font-weight:bold;">Материал топки: </span> <span style="float: right;">' + data.Material_top + '</span></p>';
            }
            if ((data.davl_vodn_seti_min != undefined) && (data.davl_vodn_seti_min != '') && (data.davl_vodn_seti_min != '0')) {
                har = har + '<p><span style="font-weight:bold;">давл.водн.сети(min),Мпа: </span> <span style="float: right;">' + data.davl_vodn_seti_min + '</span></p>';
            }
            if ((data.T_woter_max != undefined) && (data.T_woter_max != '') && (data.T_woter_max != '0')) {
                har = har + '<p><span style="font-weight:bold;">темп.воды (max): </span> <span style="float: right;">' + data.T_woter_max + '</span></p>';
            }
            if ((data.Time_nagr_min != undefined) && (data.Time_nagr_min != '') && (data.Time_nagr_min != '0')) {
                har = har + '<p><span style="font-weight:bold;">время нагрева(min): </span> <span style="float: right;">' + data.Time_nagr_min + '</span></p>';
            }
            if ((data.CompactDimensionsHeight != undefined) && (data.CompactDimensionsHeight != '')) {
                har = har + '<p><span style="font-weight:bold;">Габариты (Высота): </span> <span style="float: right;">' + data.CompactDimensionsHeight + '</span></p>';
            }
            if ((data.CompactDimensionsWidth != undefined) && (data.CompactDimensionsWidth != '')) {
                har = har + '<p><span style="font-weight:bold;">Габариты (Ширина): </span> <span style="float: right;">' + data.CompactDimensionsWidth + '</span></p>';
            }
            if ((data.CompactDimensionsLength != undefined) && (data.CompactDimensionsLength != '')) {
                har = har + '<p><span style="font-weight:bold;">Габариты (Длинна): </span> <span style="float: right;">' + data.CompactDimensionsLength + '</span></p>';
            }
            if ((data.v_teplonos != undefined) && (data.v_teplonos != '')) {
                har = har + '<p><span style="font-weight:bold;">Объем теплоносителя, л: </span> <span style="float: right;">' + data.v_teplonos + '</span></p>';
            }
            if ((data.v_system != undefined) && (data.v_system != '')) {
                har = har + '<p><span style="font-weight:bold;">Объем системы, л: </span> <span style="float: right;">' + data.v_system + '</span></p>';
            }
            if ((data.mosh_ten_kvt != undefined) && (data.mosh_ten_kvt != '')) {
                har = har + '<p><span style="font-weight:bold;">Мощность ТЭНа, кВт: </span> <span style="float: right;">' + data.mosh_ten_kvt + '</span></p>';
            }
            if ((data.napraz_vatt != undefined) && (data.napraz_vatt != '')) {
                har = har + '<p><span style="font-weight:bold;">Напряжение, В: </span> <span style="float: right;">' + data.napraz_vatt + '</span></p>';
            }
            if ((data.proizvod_kvt_max != undefined) && (data.proizvod_kvt_max != '')) {
                har = har + '<p><span style="font-weight:bold;">Производительность,кВт (max): </span> <span style="float: right;">' + data.proizvod_kvt_max + '</span></p>';
            }
            if ((data.fuel != undefined) && (data.fuel != '')) {
                har = har + '<p><span style="font-weight:bold;">Топливо: </span> <span style="float: right;">' + data.fuel + '</span></p>';
            }
            if ((data.fuel2 != undefined) && (data.fuel2 != '')) {
                har = har + '<p><span style="font-weight:bold;">Топливо 2: </span> <span style="float: right;">' + data.fuel2 + '</span></p>';
            }
            if ((data.fuel3 != undefined) && (data.fuel3 != '')) {
                har = har + '<p><span style="font-weight:bold;">Топливо 3: </span> <span style="float: right;">' + data.fuel3 + '</span></p>';
            }
            if ((data.fuel4 != undefined) && (data.fuel4 != '')) {
                har = har + '<p><span style="font-weight:bold;">Топливо 4: </span> <span style="float: right;">' + data.fuel4 + '</span></p>';
            }
            if (data.varoch_plita == '1') {
                har = har + '<p><span style="font-weight:bold;">Варочная плита: </span> <span style="float: right;">Да</span></p>';
            }
            if ((data.mass_kamn != undefined) && (data.mass_kamn != '')) {
                har = har + '<p><span style="font-weight:bold;">Варочная плита: </span> <span style="float: right;">' + data.mass_kamn + '</span></p>';
            }
            if ((data.mosh_max != undefined) && (data.mosh_max != '')) {
                har = har + '<p><span style="font-weight:bold;">Мощность (max): </span> <span style="float: right;">' + data.mosh_max + '</span></p>';
            }
            if ((data.Type_unit_control != undefined) && (data.Type_unit_control != '')) {
                har = har + '<p><span style="font-weight:bold;">Тип блока управления: </span> <span style="float: right;">' + data.Type_unit_control + '</span></p>';
            }
            if ((data.Type_electro_pitan != undefined) && (data.Type_electro_pitan != '')) {
                har = har + '<p><span style="font-weight:bold;">Тип электропитания: </span> <span style="float: right;">' + data.Type_electro_pitan + '</span></p>';
            }
            if ((data.t_in_parn != undefined) && (data.t_in_parn != '')) {
                har = har + '<p><span style="font-weight:bold;">Температура в парной: </span> <span style="float: right;">' + data.t_in_parn + '</span></p>';
            }
            if ((data.NichesDimensionsHeight != undefined) && (data.NichesDimensionsHeight != '')) {
                har = har + '<p><span style="font-weight:bold;">Габариты нишы (Высота): </span> <span style="float: right;">' + data.NichesDimensionsHeight + '</span></p>';
            }
            if ((data.NichesDimensionsWidth != undefined) && (data.NichesDimensionsWidth != '')) {
                har = har + '<p><span style="font-weight:bold;">Габариты нишы (Ширина): </span> <span style="float: right;">' + data.NichesDimensionsWidth + '</span></p>';
            }
            if ((data.NichesDimensionsLength != undefined) && (data.NichesDimensionsLength != '')) {
                har = har + '<p><span style="font-weight:bold;">Габариты нишы (Длинна): </span> <span style="float: right;">' + data.NichesDimensionsLength + '</span></p>';
            }
            if ((data.NichesDimensionsLength != undefined) && (data.NichesDimensionsLength != '')) {
                har = har + '<p><span style="font-weight:bold;">Габариты нишы (Длинна): </span> <span style="float: right;">' + data.NichesDimensionsLength + '</span></p>';
            }
            if ((data.v_zagr_drov != undefined) && (data.v_zagr_drov != '')) { har = har + '<p><span style="font-weight:bold;">Объем загрузки дров: </span> <span style="float: right;">' + data.v_zagr_drov + '</span></p>'; }
            if ((data.v_kam_sgor != undefined) && (data.v_kam_sgor != '')) { har = har + '<p><span style="font-weight:bold;">Объем камеры сгорания: </span> <span style="float: right;">' + data.v_kam_sgor + '</span></p>'; }
            if ((data.VolumeSteam != undefined) && (data.VolumeSteam != '')) { har = har + '<p><span style="font-weight:bold;">Объем помещения: </span> <span style="float: right;">' + data.VolumeSteam + '</span></p>'; }
            if ((data.VolumeSteamRoom != undefined) && (data.VolumeSteamRoom != '')) { har = har + '<p><span style="font-weight:bold;">Объем помещения: </span> <span style="float: right;">' + data.VolumeSteamRoom + '</span></p>'; }
            if (data.kontur_otopl == 1) { har = har + '<p><span style="font-weight:bold;">Контур отопления: <span style="float: right;">Да</span></p>'; }
            if (data.vstroen_preob == 1) { har = har + '<p><span style="font-weight:bold;">Встроенный преобразователь: <span style="float: right;">Да</span></p>'; }
            if ((data.Ugol != undefined) && (data.Ugol != '')) { har = har + '<p><span style="font-weight:bold;">Угол: </span> <span style="float: right;">' + data.Ugol + '</span></p>'; }
            if ((data.TolshStal != undefined) && (data.TolshStal != '')) { har = har + '<p><span style="font-weight:bold;">Толщина стали: </span> <span style="float: right;">' + data.TolshStal + '</span></p>'; }
            if ((data.ElementDimohod != undefined) && (data.ElementDimohod != '')) { har = har + '<p><span style="font-weight:bold;">Элемент дымохода: </span> <span style="float: right;">' + data.ElementDimohod + '</span></p>'; }
            if ((data.Diametr != undefined) && (data.Diametr != '')) { har = har + '<p><span style="font-weight:bold;">Диаметр: </span> <span style="float: right;">' + data.Diametr + '</span></p>'; }
            if ((data.Diametr2 != undefined) && (data.Diametr2 != '')) { har = har + '<p><span style="font-weight:bold;">Диаметр 2: </span> <span style="float: right;">' + data.Diametr2 + '</span></p>'; }
            if ((data.Dlinna != undefined) && (data.Dlinna != '')) { har = har + '<p><span style="font-weight:bold;">Длинна: </span> <span style="float: right;">' + data.Dlinna + '</span></p>'; }
            if ((data.Dlinna2 != undefined) && (data.Dlinna2 != '')) { har = har + '<p><span style="font-weight:bold;">Длинна 2: </span> <span style="float: right;">' + data.Dlinna2 + '</span></p>'; }
            if ((data.TypeDimohod != undefined) && (data.TypeDimohod != '')) { har = har + '<p><span style="font-weight:bold;">Тип материала дымохода: </span> <span style="float: right;">' + data.TypeDimohod + '</span></p>'; }
            if ((data.TypeDimohod2 != undefined) && (data.TypeDimohod2 != '')) { har = har + '<p><span style="font-weight:bold;">Тип материала дымохода 2: </span> <span style="float: right;">' + data.TypeDimohod2 + '</span></p>'; }
            if (data.Ten == '1') { har = har + '<p><span style="font-weight:bold;">ТЭН: <span style="float: right;">Да</span></p>'; }
            if (data.svet_dver_kam == '1') { har = har + '<p><span style="font-weight:bold;">Дверца со стеклом: <span style="float: right;">Да</span></p>'; }
            if (data.vtoroi_kontur_otop == '1') { har = har + '<p><span style="font-weight:bold;">Второй контур отопления: <span style="float: right;">Да</span></p>'; }
            if ((data.with_box_size != undefined) && (data.with_box_size != '')) { har = har + '<p><span style="font-weight:bold;">Размер с коробкой: <span style="float: right;">' + data.with_box_size + '</span></p>'; }

            var html;
            html = '<div class="mdl-tabs mdl-js-tabs mdl-js-ripple-effect">';
            html = html + '   <div class="mdl-tabs__tab-bar tab-good">';
            html = html + '      <a href="#tab1-panel" id="tab_panel_1" class="mdl-tabs__tab is-active">Товар</a>';
            if (har != '') {
                html = html + '      <a href="#tab2-panel" id="tab_panel_2" class="mdl-tabs__tab">Характеристики</a>';
            }
            if ((data.Description != '') || (data.Details != '')) {
                html = html + '      <a href="#tab3-panel" id="tab_panel_3" class="mdl-tabs__tab">Описание</a>';
            }
            html = html + '   </div>';
            html = html + '   <div class="mdl-tabs__panel is-active" id="tab1-panel">';
            html = html + '<div class="mdl-grid">';
            html = html + '<div class="mdl-cell mdl-cell--4-col card-good">';
            html = html + '<img width="100%" src="' + data.img + '">';
            html = html + '<div class="title-card-good">' + data.Name + '</div>';
            html = html + '</div>';
            html = html + '<div class="mdl-cell mdl-cell--4-col">';
            html = html + '<div class="price_good_view">Цена: ' + data.Price + ' руб.</div>';
            html = html + '<p>Артикул: <b>' + data.code + '</b>';
            if ((data.StockUnits == 0) || (data.StockUnits == '0') || (data.StockUnits == undefined)) {
            }
            else {
                html = html + ' | <b><span style="color:green;">В наличии</span></b>';
            }
            html = html + '</p>';
            if (data.cart == '0') {
                html = html + '<button id="button_cart_good_'+data.code+'" class="mdl-button mdl-js-button mdl-button--raised mdl-button--colored"><i class="material-icons">&#xE8CC;</i> В корзину</button>';
            }
            else {
                html = html + '<button id="button_cart_good_' + data.code + '" class="mdl-button mdl-js-button mdl-button--raised mdl-button--colored"><i class="material-icons">&#xE854;</i> В корзине</button>';
            }
            html = html + '<p></p>';
            if (data.live == '0') {
                html = html + '<button id="button_live_good_' + data.code + '" class="mdl-button mdl-js-button mdl-button--raised mdl-button--colored"><i class="material-icons">&#xE87E;</i> Отложить</button>';
            }
            else {
                html = html + '<button id="button_live_good_' + data.code + '" class="mdl-button mdl-js-button mdl-button--raised mdl-button--colored"><i class="material-icons">&#xE87D;</i> Отложен</button>';
            }
            html = html + '</div>';
            html = html + '</div>';
            html = html + '   </div>';
            html = html + '   <div class="mdl-tabs__panel" id="tab2-panel">';
            html = html + '<div class="mdl-cell mdl-cell--12-col card-good">';
            html = html + har;
            html = html + '   </div>';
            html = html + '   </div>';
            html = html + '   <div class="mdl-tabs__panel" id="tab3-panel">';
            html = html + '<div class="mdl-cell mdl-cell--12-col card-good">';
            html = html + data.Description;
            html = html + data.Details;
            html = html + '   </div>';
            html = html + '   </div>';
            html = html + '</div>';
            $('.good').html(html);

            document.getElementById("button_cart_good_" + data.code).addEventListener("click", function () { cartAdd(data.code); });
            document.getElementById("button_live_good_" + data.code).addEventListener("click", function () { liveAdd(data.code); });
            document.getElementById("tab_panel_1").addEventListener("click", function () { TabClick("tab1-panel") });
            if (har != '') {
                document.getElementById("tab_panel_2").addEventListener("click", function () { TabClick("tab2-panel") });
            }
            if ((data.Description != '') || (data.Details != '')) {
                document.getElementById("tab_panel_3").addEventListener("click", function () { TabClick("tab3-panel") });
            }
            waitEnd();

        }).fail(function () { dialog_show('dialog_no_ethernet'); });
    }

    function view_akcii() {
        waitStart();
        HideAllShowOne('akcii');
        HideInputSearch()

        var url = 'http://blokartopt.ru/api/?action=akcii';
        var html = '';

        $.getJSON(url, function (data) {
            html = '<div class="mdl-grid">';
            html = html + '<div class="mdl-cell mdl-cell--12-col"><h4>Акции</h4></div>';
            if (data != null)
            {
                var style = '';
                data.akcii.forEach(function (item, i, arr)
                {
                    style = style + '#akcii_' + arr[i].Message_ID + '{width: 100%;position: relative;} #akcii_' + arr[i].Message_ID + ' > img{    width: 100%;float: left;} #akcii_' + arr[i].Message_ID + ' > div{position: absolute;background: rgba(255,102,0,0.9);width: calc(100% - 10px);padding: 5px;color: white;font-weight: bold;bottom: 0px;text-align: center;}';
                    html = html + '<div class="mdl-cell mdl-cell--6-col" id="akcii_' + arr[i].Message_ID + '"><img src="' + arr[i].img + '"><div>' + arr[i].titles + '</div></div>';
                });
                html = html + '<style>'+style+'</style>';
            }
            else
            {
                html = html + '<div class="mdl-cell mdl-cell--12-col">';
                html = html + '<center>';
                html = html + '<img style="width: 100px;padding-bottom: 50px;padding-top: 50px;" src="images/empty_basket.png">';
                html = html + '<br><i>В данный момент у нас не проходит никаких акций</i>';
                html = html + '</center>';
                html = html + '</div>';
            }
            html = html + '</div>';
            $('.akcii').html(html);
            if (data != null)
            {
                data.akcii.forEach(function (item, i, arr) {
                    document.getElementById("akcii_" + arr[i].Message_ID).addEventListener("click", function () { view_akcia(arr[i].Message_ID); });
                });
            }
            waitEnd();
        }).fail(function () { dialog_show('dialog_no_ethernet'); });
    }

    function view_akcia(Message_ID)
    {
        waitStart();
        HideAllShowOne('akcii_view');
        HideInputSearch()

        var url = 'http://blokartopt.ru/api/?action=akcii&id=' + Message_ID;
        var html = '';
        $.getJSON(url, function (data) {
            html = '<div class="mdl-grid">';
            if (data.akcii != undefined) {
                var style = '';
                data.akcii.forEach(function (item, i, arr) {
                    html = html + '<div class="mdl-cell mdl-cell--12-col">';
                    html = html + '<h4>'+arr[i].titles+'</h4>';
                    html = html + '<img style="width:100%;margin-top:10px;" src="' + arr[i].img + '">';
                    html = html + arr[i].Des;
                    html = html + '<p><button class="mdl-button mdl-js-button mdl-button--raised mdl-button--colored" id="button_akcii_' + arr[i].Sub_id + '"><i class="material-icons">&#xE8F4;</i> Перейти в раздел</button></div>';
                });
            }
            else {
                html = html + '<div class="mdl-cell mdl-cell--12-col">';
                html = html + '<center>';
                html = html + '<img style="width: 100px;padding-bottom: 50px;padding-top: 50px;" src="images/empty_basket.png">';
                html = html + '<br><i>К сожалению эта акция уже закончилась</i>';
                html = html + '</center>';
                html = html + '</div>';
            }
            html = html + '</div>';
            $('.akcii_view').html(html);
            if (data.akcii != undefined) {
                data.akcii.forEach(function (item, i, arr) {
                    document.getElementById("button_akcii_" + arr[i].Sub_id).addEventListener("click", function () { view_catalog(arr[i].Sub_id, 1) });
                });
            }
            waitEnd();
        }).fail(function () { dialog_show('dialog_no_ethernet'); });
    }

    function view_goods_discounted(sub, page)
    {
        waitStart();
        HideAllShowOne('goods_discounted');
        HideInputSearch()

        if (page == undefined)
        {
            var page = 1;
        }
        var user = $.cookie('User_ID');
        var html = '';
        $('.goods_discounted').html('');
        html = html + '<div class="mdl-grid">';
        html = html + '<div class="mdl-cell mdl-cell--12-col"><h4>Распродажи</h4></div>';
        html = html + '</div>';
        var url = 'http://blokartopt.ru/api/?action=goods_discounted&page=' + page + '&user=' + user;
        $.getJSON(url, function (data) {
            if (data.goods != undefined) {
                html = html + '<div class="mdl-grid">';
                data.goods.forEach(function (item, i, arr) {
                    html = html + '<div class="mdl-cell mdl-cell--4-col mdl-card mdl-shadow--2dp mdl-sub-click">';
                    html = html + '<div class="mdl-img-sub" id="good_img_' + arr[i].code + '"><img src="' + arr[i].img + '"></div>';
                    html = html + '<div class="mdl_text_good" id="good_text_' + arr[i].code + '">';
                    html = html + arr[i].Name;
                    html = html + '<div class="price_good">Цена: <span style="text-decoration: line-through;color: #d03000;font-size: 16px;">' + arr[i].OldPrice + '</span> '+arr[i].Price+' руб.</div>';
                    html = html + '<p>Артикул: <b>' + arr[i].code + '</b>';
                    if ((arr[i].StockUnits == 0) || (arr[i].StockUnits == '0') || (arr[i].StockUnits == undefined)) {
                    }
                    else {
                        html = html + ' | <b><span style="color:green;">В наличии</span></b>';
                    }
                    html = html + '</p>';
                    html = html + '</div>';
                    html = html + '<div class="mdl-card__actions mdl-card--border">';

                    if (arr[i].cart == '0') {
                        html = html + '<button class="mdl-button mdl-js-button mdl-button--raised mdl-button--colored" id="button_cart_' + arr[i].code + '"><i class="material-icons">&#xE8CC;</i> В корзину</button>';
                    }
                    else {
                        html = html + '<button class="mdl-button mdl-js-button mdl-button--raised mdl-button--colored" id="button_cart_' + arr[i].code + '"><i class="material-icons">&#xE854;</i> В корзине</button>';
                    }
                    html = html + '<p></p>';
                    if (arr[i].live == '0') {
                        html = html + '<button class="mdl-button mdl-js-button mdl-button--raised mdl-button--colored" id="button_live_' + arr[i].code + '"><i class="material-icons">&#xE87E;</i> Отложить</button>';
                    }
                    else {
                        html = html + '<button class="mdl-button mdl-js-button mdl-button--raised mdl-button--colored" id="button_live_' + arr[i].code + '"><i class="material-icons">&#xE87D;</i> Отложен</button>';
                    }

                    html = html + '</div>';
                    html = html + '</div>';
                });
                html = html + '</div>';
                html = html + pagination(page, data.count_pages, 'view_goods_discounted', 15, sub);
                $('.goods_discounted').html(html);

                data.goods.forEach(function (item, i, arr) {
                    document.getElementById("good_img_" + arr[i].code).addEventListener("click", function () { view_good(arr[i].code, 'view_goods_discounted', page, 0); });
                    document.getElementById("good_text_" + arr[i].code).addEventListener("click", function () { view_good(arr[i].code, 'view_goods_discounted', page, su0b); });
                });

                pagination_event(page, data.count_pages, 'view_goods_discounted', 15, sub);
                data.goods.forEach(function (item, i, arr) {
                    document.getElementById("button_cart_" + arr[i].code).addEventListener("click", function () { cartAdd(arr[i].code); });
                    document.getElementById("button_live_" + arr[i].code).addEventListener("click", function () { liveAdd(arr[i].code); });
                });
                waitEnd();
            }
        }).fail(function () { dialog_show('dialog_no_ethernet'); });
    }

    function view_live()
    {
        waitStart();
        HideAllShowOne('live');
        HideInputSearch()

        var user = $.cookie('User_ID');
        var html = '';
        $('.live').html('');
        html = html + '<div class="mdl-grid">';
        html = html + '<div class="mdl-cell mdl-cell--12-col"><h4>Отложенные товары</h4></div>';
        html = html + '</div>';
        var url = 'http://blokartopt.ru/api/?action=live&user=' + user;
        $.getJSON(url, function (data)
        {
            if (data != null)
            {
                html = html + '<div class="mdl-grid">';
                data.live.forEach(function (item, i, arr) {
                    html = html + '<div class="mdl-cell mdl-cell--4-col mdl-card mdl-shadow--2dp mdl-sub-click live_block" id="live_block_'+arr[i].code+'">';
                    html = html + '<div class="mdl-img-sub" id="good_img_' + arr[i].code + '" style="text-align:center;"><img src="' + arr[i].img + '"></div>';
                    html = html + '<div class="mdl_text_good" id="good_text_' + arr[i].code + '">';
                    html = html + arr[i].Name;
                    if (arr[i].OldPrice == null)
                    {
                        arr[i].OldPrice = '';
                    }
                    html = html + '<div class="price_good">Цена: <span style="text-decoration: line-through;color: #d03000;font-size: 16px;">' + arr[i].OldPrice + '</span> ' + arr[i].Price + ' руб.</div>';
                    html = html + '<p>Артикул: <b>' + arr[i].code + '</b>';
                    if ((arr[i].StockUnits == 0) || (arr[i].StockUnits == '0') || (arr[i].StockUnits == undefined)) {
                    }
                    else {
                        html = html + ' | <b><span style="color:green;">В наличии</span></b>';
                    }
                    html = html + '</p>';
                    html = html + '</div>';
                    html = html + '<div class="mdl-card__actions mdl-card--border">';

                    if (arr[i].cart == '0') {
                        html = html + '<button class="mdl-button mdl-js-button mdl-button--raised mdl-button--colored" id="button_cart_' + arr[i].code + '"><i class="material-icons">&#xE8CC;</i> В корзину</button>';
                    }
                    else {
                        html = html + '<button class="mdl-button mdl-js-button mdl-button--raised mdl-button--colored" id="button_cart_' + arr[i].code + '"><i class="material-icons">&#xE854;</i> В корзине</button>';
                    }
                    html = html + '<p></p>';
                    html = html + '<button class="mdl-button mdl-js-button mdl-button--raised mdl-button--colored" id="button_live_delete_' + arr[i].code + '"><i class="material-icons">&#xE87D;</i> Убрать из отложенных</button>';

                    html = html + '</div>';
                    html = html + '</div>';
                });
                html = html + '</div>';
                $('.live').html(html);

                data.live.forEach(function (item, i, arr) {
                    document.getElementById("good_img_" + arr[i].code).addEventListener("click", function () { view_good(arr[i].code, 'view_live', 0, 0); });
                    document.getElementById("good_text_" + arr[i].code).addEventListener("click", function () { view_good(arr[i].code, 'view_live', 0, 0); });
                });

                data.live.forEach(function (item, i, arr) {
                    document.getElementById("button_cart_" + arr[i].code).addEventListener("click", function () { cartAdd(arr[i].code); });
                    document.getElementById("button_live_delete_" + arr[i].code).addEventListener("click", function () { liveDelete(arr[i].code); });
                });
                waitEnd();
            }
            else
            {
                html = html + '<div class="mdl-cell mdl-cell--12-col">';
                html = html + '<center>';
                html = html + '<img style="width: 100px;padding-bottom: 50px;padding-top: 50px;" src="images/empty_basket.png">';
                html = html + '<br><i>Список отложенных товаров пуст и это немного грустно</i>';
                html = html + '</center>';
                html = html + '</div>';
                $('.live').html(html);
                waitEnd();
            }
        }).fail(function () { dialog_show('dialog_no_ethernet'); });
    }

    function view_contacts()
    {
        waitStart();
        HideAllShowOne('contacts');
        HideInputSearch()

        var url = 'http://blokartopt.ru/api/?action=contacts';
        var html = '';

        $.get(url, function (data) {
            html = html + '<div class="mdl-grid"><div class="mdl-cell mdl-cell--12-col"><h4>Контакты</h4>' + data + '</div></div>';
            $('.contacts').html(html);
            waitEnd();
        }).fail(function () { dialog_show('dialog_no_ethernet'); });
    }

    function view_form_message()
    {
        $('#form_message').trigger('reset');
        HideInputSearch()
        HideAllShowOne('view_form_message');
    }

    function view_cart()
    {
        waitStart();
        HideAllShowOne('cart');
        HideInputSearch()

        var user = $.cookie('User_ID');
        var html = '';
        $('.cart').html('');
        html = html + '<div class="mdl-grid">';
        html = html + '<div class="mdl-cell mdl-cell--12-col"><h4>Корзина</h4></div>';
        html = html + '</div>';
        var url = 'http://blokartopt.ru/api/?action=cart&user=' + user;
        $.getJSON(url, function (data) {
            if (data.qty > 0)
            {
                html = html + '<div class="mdl-grid">';
                var sum_all = 0;
                var sum_qty = 0;
                data.cart.forEach(function (item, i, arr)
                {
                    html = html + '<div class="mdl-cell mdl-cell--4-col mdl-card mdl-shadow--2dp mdl-sub-click cart_good_block" id="cart_good_' + arr[i].code + '">';
                    html = html + '<div class="mdl-img-sub" id="good_img_' + arr[i].code + '"><img src="' + arr[i].img + '"></div>';
                    html = html + '<div class="mdl_text_good" id="good_text_' + arr[i].code + '">';
                    html = html + arr[i].Name;
                    if (arr[i].OldPrice == null)
                    {
                        arr[i].OldPrice = '';
                    }
                    html = html + '<div class="price_good">Цена: <span style="text-decoration: line-through;color: #d03000;font-size: 16px;">' + arr[i].OldPrice + '</span> ' + arr[i].Price + ' руб.</div>';
                    html = html + '<div class="price_good">Итог: <span id="cart_itog_'+arr[i].code+'">' + arr[i].QTY * arr[i].Price + '</span> руб.</div>';
                    html = html + '<p>Артикул: <b>' + arr[i].code + '</b>';
                    if ((arr[i].StockUnits == 0) || (arr[i].StockUnits == '0') || (arr[i].StockUnits == undefined)) {
                    }
                    else {
                        html = html + ' | <b><span style="color:green;">В наличии</span></b>';
                    }
                    html = html + '</p>';
                    html = html + '</div>';
                    html = html + '<div class="mdl-card__actions mdl-card--border">';
                    html = html + '<form action="#">';
                    html = html + '<div class="mdl-textfield mdl-js-textfield mdl-textfield--floating-label">';
                    html = html + '<i class="material-icons cart_left" id="cart_minus_' + arr[i].code + '">&#xE15D;</i>';
                    html = html + '<input class="mdl-textfield__input cart_qty" type="number" pattern="-?[0-9]*(\.[0-9]+)?" id="cart_' + arr[i].code + '" value="' + arr[i].QTY + '">';
                    html = html + '<i class="material-icons cart_right" id="cart_plus_' + arr[i].code + '">&#xE148;</i>';
                    html = html + '</div>';
                    html = html + '</form>';
                    html = html + '</div>';
                    html = html + '</div>';
                    sum_all = sum_all + (arr[i].QTY * arr[i].Price);
                    sum_qty = sum_qty + parseInt(arr[i].QTY);
                });
                html = html + '<div class="mdl-cell mdl-cell--12-col">';
                html = html + '<h4>Итого</h4>';
                html = html + '<div class="price_good" style="text-align: center;font-weight: normal;"><span id="qty_all">' + sum_qty + '</span> товаров на сумму<p style="font-size: 23px;margin-top: 10px;margin-bottom: 0px;"><span id="sum_all">' + sum_all + '</span> руб.</div>';
                html = html + '</div>';
                html = html + '<div class="mdl-cell mdl-cell--12-col">';
                html = html + '<button class="mdl-button mdl-js-button mdl-button--raised mdl-button--colored" id="button_view_order"><i class="material-icons">&#xE870;</i> Оформить заказ</button></div>';
                html = html + '</div>';
                html = html + '</div>';
                $('.cart').html(html);
                document.getElementById("button_view_order").addEventListener("click", function () { view_order(); });
                data.cart.forEach(function (item, i, arr) {
                    document.getElementById("good_img_" + arr[i].code).addEventListener("click", function () { view_good(arr[i].code, 'view_cart', 0, 0); });
                    document.getElementById("good_text_" + arr[i].code).addEventListener("click", function () { view_good(arr[i].code, 'view_cart', 0, 0); });
                    document.getElementById("cart_plus_" + arr[i].code).addEventListener("click", function () { cartPlus(arr[i].code); });
                    document.getElementById("cart_minus_" + arr[i].code).addEventListener("click", function () { cartMinus(arr[i].code); });
                    document.getElementById("cart_" + arr[i].code).addEventListener("oninput", function () { cartUpdate(arr[i].code); });
                    document.getElementById("cart_" + arr[i].code).addEventListener("input", function () { cartUpdate(arr[i].code); });
                });
                waitEnd();
            }
            else {
                html = html + '<div class="mdl-cell mdl-cell--12-col">';
                html = html + '<center>';
                html = html + '<img style="width: 100px;padding-bottom: 50px;padding-top: 50px;" src="images/empty_basket.png">';
                html = html + '<br><i>Ваша корзина пуста и это немного грустно</i>';
                html = html + '</center>';
                html = html + '</div>';
                $('.cart').html(html);
                waitEnd();
            }
        }).fail(function () { dialog_show('dialog_no_ethernet'); });
    }

    function view_order()
    {
        HideAllShowOne('order');
        HideInputSearch()
    }

    function view_search(sub, page)
    {
        HideAllShowOne('search');
        waitStart();
        if ((page == '') || (page == undefined)) {
            page = 1;
        }
        $('.search').html('');
        var html = ''
        var user = $.cookie('User_ID');
        html = html + '<div class="mdl-grid">';
        html = html + '<div class="mdl-cell mdl-cell--12-col"><h4>Результат поиска "' + $('#search_text').val() + '"</h4></div>';
        html = html + '</div>';
        var url = 'http://blokartopt.ru/api/?action=searchs&qwerty=' + encodeURI($('#search_text').val()) + '&page=' + page + '&user=' + user;
        $.getJSON(url, function (data)
        {
            if ((data.count_pages != null)&&(data.count_pages != 0))
            {
                data.goods.forEach(function (item, i, arr)
                {
                    html = html + '<div class="mdl-cell mdl-cell--4-col mdl-card mdl-shadow--2dp mdl-sub-click">';
                    html = html + '<div class="mdl-img-sub" id="good_img_' + arr[i].code + '"><img src="' + arr[i].img + '"></div>';
                    html = html + '<div class="mdl_text_good" id="good_text_' + arr[i].code + '">';
                    html = html + arr[i].Name;
                    html = html + '<div class="price_good">Цена: ' + arr[i].Price + ' руб.</div>';
                    html = html + '<p>Артикул: <b>' + arr[i].code + '</b>';
                    if ((arr[i].StockUnits == 0) || (arr[i].StockUnits == '0') || (arr[i].StockUnits == undefined)) {
                    }
                    else {
                        html = html + ' | <b><span style="color:green;">В наличии</span></b>';
                    }
                    html = html + '</p>';
                    html = html + '</div>';
                    html = html + '<div class="mdl-card__actions mdl-card--border">';

                    if (arr[i].cart == '0') {
                        html = html + '<button class="mdl-button mdl-js-button mdl-button--raised mdl-button--colored" id="button_cart_' + arr[i].code + '"><i class="material-icons">&#xE8CC;</i> В корзину</button>';
                    }
                    else {
                        html = html + '<button class="mdl-button mdl-js-button mdl-button--raised mdl-button--colored" id="button_cart_' + arr[i].code + '"><i class="material-icons">&#xE854;</i> В корзине</button>';
                    }
                    html = html + '<p></p>';
                    if (arr[i].live == '0') {
                        html = html + '<button class="mdl-button mdl-js-button mdl-button--raised mdl-button--colored" id="button_live_' + arr[i].code + '"><i class="material-icons">&#xE87E;</i> Отложить</button>';
                    }
                    else {
                        html = html + '<button class="mdl-button mdl-js-button mdl-button--raised mdl-button--colored" id="button_live_' + arr[i].code + '"><i class="material-icons">&#xE87D;</i> Отложен</button>';
                    }

                    html = html + '</div>';
                    html = html + '</div>';
                });
                html = html + pagination(page, data.count_pages*15, 'view_search', 15, 0);
                $('.search').html(html);
                data.goods.forEach(function (item, i, arr) {
                    document.getElementById("good_img_" + arr[i].code).addEventListener("click", function () { view_good(arr[i].code, 'view_search', page, 0); });
                    document.getElementById("good_text_" + arr[i].code).addEventListener("click", function () { view_good(arr[i].code, 'view_search', page, 0); });
                });

                pagination_event(page, data.count_pages*15, 'view_search', 15, 0);
                data.goods.forEach(function (item, i, arr) {
                    document.getElementById("button_cart_" + arr[i].code).addEventListener("click", function () { cartAdd(arr[i].code); });
                    document.getElementById("button_live_" + arr[i].code).addEventListener("click", function () { liveAdd(arr[i].code); });
                });
            }
            else
            {
                html = html + '<div class="mdl-cell mdl-cell--12-col">';
                html = html + '<center>';
                html = html + '<img style="width: 100px;padding-bottom: 50px;padding-top: 50px;" src="images/empty_basket.png">';
                html = html + '<br><i>По Вашему запросу ничего не найдено</i>';
                html = html + '</center>';
                html = html + '</div>';
                $('.search').html(html);
            }
            waitEnd();
        }).fail(function () { dialog_show('dialog_no_ethernet'); });
    }

    function TabClick(tabIDShow)
    {

        if ($('#' + tabIDShow).css('display') == 'block')
        {
            return false;
        }

        var ArrayDiv = new Array();
        var ArrayDivButton = new Array();

        var strDiv = '';
        var strDiv2 = '';
        ArrayDiv[0] = 'tab1-panel';
        ArrayDiv[1] = 'tab2-panel';
        ArrayDiv[2] = 'tab3-panel';

        ArrayDivButton[0] = 'tab_panel_1';
        ArrayDivButton[1] = 'tab_panel_2';
        ArrayDivButton[2] = 'tab_panel_3';

        ArrayDiv.forEach(function (i, val)
        {
            if ((tabIDShow != i) && ($('#' + ArrayDivButton[val]).css('display') == 'block'))
            {
                if (strDiv == '')
                {
                    strDiv = '#' + i;
                    strDiv2 = '#' + ArrayDivButton[val];
                }
                else
                {
                    strDiv = strDiv + ', #' + i;
                    strDiv2 = strDiv2 + ', #' + ArrayDivButton[val];
                }
            }
            else
            {
                $('#'+ArrayDivButton[val]).addClass('is-active');
            }
        });
        if (strDiv != '')
        {
            $(strDiv).animate({ opacity: 0 }, 250, function () {
                $(strDiv).hide(0, function () {
                    $('#' + tabIDShow).show(0, function () {
                        $('#' + tabIDShow).animate({ opacity: 1 }, 250);
                    });
                });
            });
            $(strDiv2).removeClass('is-active');
        }
        else
        {
            $('#' + tabIDShow).show(0, function () {
                $('#' + tabIDShow).animate({ opacity: 1 }, 250);
            });
        }
        return false;
    }

    /*Функция скрывает все контентные блоки,
    показывает только блок с именем переданным в
    переменной "ClassShowName" и скрывает меню*/
    function HideAllShowOne(ClassShowName)
    {
        var ArrayDiv = new Array();
        var strDiv = '';
        ArrayDiv[0] = 'index';
        ArrayDiv[1] = 'catalog';
        ArrayDiv[2] = 'good';
        ArrayDiv[3] = 'akcii';
        ArrayDiv[4] = 'akcii_view';
        ArrayDiv[5] = 'goods_discounted';
        ArrayDiv[6] = 'live';
        ArrayDiv[7] = 'contacts';
        ArrayDiv[8] = 'about';
        ArrayDiv[9] = 'view_form_message';
        ArrayDiv[10] = 'view_form_message_ok';
        ArrayDiv[11] = 'cart';
        ArrayDiv[12] = 'order';
        ArrayDiv[13] = 'view_form_order_ok';
        ArrayDiv[14] = 'search';

        ArrayDiv.forEach(function (i, val)
        {
            if ((ClassShowName != i)&&($('.'+i).css('display') == 'block'))
            {
                if (strDiv == '')
                {
                    strDiv = '.'+i;
                }
                else
                {
                    strDiv = strDiv+', .'+i;
                }
            }
        });
        if (strDiv != '')
        {
            $(strDiv).animate({opacity:0}, 250, function()
            {
                $(strDiv).hide(0, function()
                {
                    $('.'+ClassShowName).show(0, function()
                    {
                        $('.'+ClassShowName).animate({opacity:1}, 250);
                    });
                });
            });
        }
        else
        {
            $('.'+ClassShowName).show(0, function()
            {
                $('.'+ClassShowName).animate({opacity:1}, 250);
            });
        }
        if ($('body').find('.mdl-layout__drawer').attr('aria-hidden') == 'false') {
            $('.mdl-layout__obfuscator').click();
        }
    }

    function HideInputSearch()
    {
        $('#search_text').val('');
        var p1 = $('#search_text').parent();
        var p2 = $(p1).parent();
        $(p2).removeClass('is-focused');
        $(p2).removeClass('is-dirty');
    }

    /*Фукнция добавляет товар в корзину по его коду*/
    function cartAdd(codeGood)
    {
        waitStart();
        var user = $.cookie('User_ID');
        var url = 'http://blokartopt.ru/api/?action=cart_plus&good=' + codeGood + '&user=' + user;
        $.get(url, function ()
        {
            $('#button_cart_' + codeGood).html('<i class="material-icons">&#xE854;</i> В корзине');
            dialog_show('dialog_cart_add');
            cart_min();
            waitEnd();
        }).fail(function () { dialog_show('dialog_no_ethernet'); });
    }

    function cartPlus(codeGood)
    {
        var qty = $('#cart_' + codeGood).val();
        qty = parseInt(qty) + 1;
        $('#cart_' + codeGood).val(qty);
        cartUpdate(codeGood);
    }

    function cartMinus(codeGood)
    {
        var qty = $('#cart_' + codeGood).val();
        qty = parseInt(qty) - 1;
        $('#cart_' + codeGood).val(qty);
        cartUpdate(codeGood);
    }

    function cartUpdate(codeGood)
    {
        var qty = parseInt($('#cart_' + codeGood).val());
        var user = $.cookie('User_ID');
        var url = 'http://blokartopt.ru/api/?action=cart_update&good=' + codeGood + '&user=' + user + '&count=' + qty;
        if (qty <= 0)
        {
            $('#cart_good_' + codeGood).animate({ 'opacity': 0 }, 250, function ()
            {
                $('#cart_good_' + codeGood).hide();
            });
        }
        $.get(url, function ()
        {
            var url = 'http://blokartopt.ru/api/?action=cart&user=' + user;
            $.getJSON(url, function (data)
            {
                if (data.qty > 0)
                {
                    $('#qty_all').html(data.qty);
                    $('.material-icons-cart').attr('data-badge', data.qty);
                    var summ_end = 0;
                    data.cart.forEach(function (item, i, arr)
                    {
                        if (codeGood == arr[i].code)
                        {
                            var startPrice = parseInt($('#cart_itog_' + codeGood).html());
                            var endPrice = parseInt(arr[i].Price * arr[i].QTY);
                            $('#cart_itog_' + codeGood).prop('number', startPrice).animateNumber(
                                {
                                    number: endPrice
                                });
                        }
                        summ_end = summ_end + (arr[i].Price * arr[i].QTY);
                    });
                    var summ_start = parseInt($('#sum_all').html());
                    $('#sum_all').prop('number', summ_start).animateNumber(
                        {
                            number: summ_end
                        });
                }
                else
                {
                    var html = '';
                    html = html + '<div class="mdl-grid">';
                    html = html + '<div class="mdl-cell mdl-cell--12-col"><h4>Корзина</h4></div>';
                    html = html + '</div>';
                    html = html + '<div class="mdl-cell mdl-cell--12-col">';
                    html = html + '<center>';
                    html = html + '<img style="width: 100px;padding-bottom: 50px;padding-top: 50px;" src="images/empty_basket.png">';
                    html = html + '<br><i>Ваша корзина пуста и это немного грустно</i>';
                    html = html + '</center>';
                    html = html + '</div>';
                    $('.cart').html(html);
                    $('.material-icons-cart').attr('data-badge', 0);
                }
            });
        }).fail(function () { dialog_show('dialog_no_ethernet'); });
        if ($('.cart_good_block').length == 0)
        {

        }
    }

    /*Функция добавляет товар в список отложенных по его коду*/
    function liveAdd(codeGood)
    {
        waitStart();
        var user = $.cookie('User_ID');
        var url = 'http://blokartopt.ru/api/?action=live_add&good=' + codeGood + '&user=' + user;
        $.get(url, function () {
            $('#button_live_' + codeGood).html('<i class="material-icons">&#xE87D;</i> отложен');
            dialog_show('dialog_live_add');
            waitEnd();
        }).fail(function () { dialog_show('dialog_no_ethernet'); });
    }

    function liveDelete(codeGood)
    {
        var user = $.cookie('User_ID');
        var url = 'http://blokartopt.ru/api/?action=live_delete&good=' + codeGood + '&user=' + user;
        $.get(url, function () {
            $('#live_block_' + codeGood).animate({ opacity: 0 }, 250, function () {
                $('#live_block_' + codeGood).remove();
                if ($('.live_block').length == 0)
                {
                    var html = '';
                    html = html + '<div class="mdl-grid">';
                    html = html + '<div class="mdl-cell mdl-cell--12-col"><h4>Отложенные товары</h4></div>';
                    html = html + '</div>';
                    html = html + '<div class="mdl-cell mdl-cell--12-col">';
                    html = html + '<center>';
                    html = html + '<img style="width: 100px;padding-bottom: 50px;padding-top: 50px;" src="images/empty_basket.png">';
                    html = html + '<br><i>Список отложенных товаров пуст и это немного грустно</i>';
                    html = html + '</center>';
                    html = html + '</div>';
                    $('.live').html(html);
                }
            });
        });
    }

    function send_message()
    {
        waitStart();
        var user = $.cookie('User_ID');
        var text = $('#feedback_text').val();
        var error = 0;
        if (text == '')
        {
            error = error + 1;
            var parent = $('#feedback_text').parent();
            $(parent).find('label').css('color', 'red');
            waitEnd();
        }
        else
        {
            var parent = $('#feedback_text').parent();
            $(parent).find('label').css('color', 'rgba(0,0,0, 0.26)');
        }
        if (error == 0)
        {
            var form_id = 'form_message';
            var form = document.forms[form_id];
            var m_action = 'http://blokartopt.ru/api/?action=create_message&user=' + user + '&text=' + text;
            var formData = new FormData(form);
            var xhr = new XMLHttpRequest();
            xhr.open("POST", m_action, true);
            xhr.onreadystatechange = function ()
            {
                if (xhr.readyState == 4)
                {
                    if (xhr.status == 200)
                    {
                        HideAllShowOne('view_form_message_ok');
                    }
                    else {
                        dialog_show('dialog_no_ethernet');
                    }
                }
                waitEnd();
            };
            xhr.send(formData);
        }
    }

    function send_order()
    {
        waitStart();
        var user = $.cookie('User_ID');
        var text = $('#order_text').val();
        var error = 0;
        if (text == '') {
            error = error + 1;
            var parent = $('#order_text').parent();
            $(parent).find('label').css('color', 'red');
            waitEnd();
        }
        else {
            var parent = $('#order_text').parent();
            $(parent).find('label').css('color', 'rgba(0,0,0, 0.26)');
        }
        if (error == 0)
        {
            var form_id = 'form_order';
            var form = document.forms[form_id];
            var m_action = 'http://blokartopt.ru/api/?action=create_order&user=' + user + '&text=' + text;
            var formData = new FormData(form);
            var xhr = new XMLHttpRequest();
            xhr.open("POST", m_action, true);
            xhr.onreadystatechange = function () {
                if (xhr.readyState == 4) {
                    if (xhr.status == 200)
                    {
                        $('.material-icons-cart').attr('data-badge','0');
                        HideAllShowOne('view_form_order_ok');
                    }
                    else {
                        dialog_show('dialog_no_ethernet');
                    }
                }
                waitEnd();
            };
            xhr.send(formData);
        }
    }

    /*функция показывает постраничную навигацию
    page - номер уже текущей страницы
    allGoods - всего товаров в разделе
    functionName - название функции
    count_view - сколько товаров отображается на странице*/
    function pagination(page, allGoods, functionName, count_view, sub)
    {
        var html;
        var count;
        var i;
        html = '<ul class="pagination">';
        count = Math.ceil(allGoods / count_view);
        if (allGoods <= count_view) {
            return '';
        }
        if (count > 1)
        {
            if (page == 1)
            {
                for (i = 1; i < 5; i++)
                {
                    if (i <= count)
                    {
                        if (page == i)
                        {
                            html = html + '<li class="active">' + i + '</li>';
                        }
                        else
                        {
                            html = html + '<li id="' + functionName + '_' + sub + '_' + i + '_' + page + '" onClick="' + functionName + '('+sub+', '+i+')">' + i + '</li>';
                        }
                    }
                }
            }
            else if (page == 0)
            {
                for (i = 1; i < 5; i++) {
                    if (i <= count) {
                        if (page == i)
                        {
                            html = html + '<li class="active">' + i + '</li>';
                        }
                        else
                        {
                            html = html + '<li id="' + functionName + '_' + sub + '_' + i + '_' + page + '" onClick="' + functionName + '(' + sub + ', ' + i + ')">' + i + '</li>';
                        }
                    }
                }
            }
            else {
                for (i = page - 1; i < page + 4; i++) {
                    if (i <= count)
                    {
                        if (page == i)
                        {
                            html = html + '<li class="active">' + i + '</li>';
                        }
                        else
                        {
                            html = html + '<li id="' + functionName + '_' + sub + '_' + i + '_' + page + '" onClick="' + functionName + '(' + sub + ', ' + i + ')">' + i + '</li>';
                        }
                    }
                }
            }
        }
        html = html + '</ul>';
        return html;
    }

    /*функция присваивает события постраничной навигации
    функцию допустимо вызывать после того как html код навигации будет размещен на странице
    page - номер уже текущей страницы
    allGoods - всего товаров в разделе
    functionName - название функции
    count_view - сколько товаров отображается на странице*/
    function pagination_event(page, allGoods, functionName, count_view, sub) {
        var count;
        var i;
        count = Math.ceil(allGoods / count_view);
        if (allGoods <= count_view) {
            return '';
        }
        if (count > 1) {
            if (page == 1) {
                for (i = 1; i < 4; i++) {
                    if (i <= count) {
                        if (page != i)
                        {
                            document.getElementById(functionName + '_' + sub + '_' + i + '_' + page).addEventListener("click", function () { eval($(this).attr('onClick')); });
                        }
                    }
                }
            }
            else if (page == 0) {
                for (i = 1; i < 4; i++) {
                    if (i <= count) {
                        if (page != i)
                        {

                            document.getElementById(functionName + '_' + sub + '_' + i + '_' + page).addEventListener("click", function () { eval($(this).attr('onClick')); });
                        }
                    }
                }
            }
            else {
                for (i = page - 1; i < page + 3; i++) {
                    if (i <= count) {
                        if (page != i) {
                            document.getElementById(functionName + '_' + sub + '_' + i + '_' + page).addEventListener("click", function () { eval($(this).attr('onClick')); });
                        }
                    }
                }
            }
        }
        return true;
    }

    /*функция отвечает за изменение информации в мини корзину (вверху)*/
    function cart_min()
    {
        var user = $.cookie('User_ID');
        var url = 'http://blokartopt.ru/api/?action=cart&user=' + user;
        $.getJSON(url, function (data)
        {
            $('.material-icons-cart').attr('data-badge', data.qty);
        }).fail(function () { dialog_show('dialog_no_ethernet'); });
    }

    /*Функция показывает диалоговое окно по его id*/
    function dialog_show(dialogName)
    {
        $('#' + dialogName).css('opacity', '0');
        $('#' + dialogName).css('display', 'block');
        $('#' + dialogName).show(250, function ()
        {
            var dialog = document.querySelector('#' + dialogName);
            $('.background_dialog').show();

            /*костыль для старых версий*/
            window_resize();

            $('main').attr('style', '');
            $('#' + dialogName).animate({'opacity': '1'}, 250, function()
            {
                if (dialogName == 'dialog_no_ethernet')
                {
                    dialog.querySelector('.close').addEventListener('click', function ()
                    {
                        reload_page();
                    });
                }
                else
                {
                    dialog.querySelector('.close').addEventListener('click', function ()
                    {
                        $('#' + dialogName).css('display', 'none');
                        $('#' + dialogName).hide();
                        $('.background_dialog').hide();
                        setTimeout("$('main').css('position', 'relative')", 250);
                    });
                }
            });
        });
    }

    function window_resize()
    {
        setTimeout(function ()
        {
            if ($('.background_dialog').css('display') == 'block')
            {
                $('dialog').each(function ()
                {
                    if ($(this).css('display') == 'block')
                    {
                        var width_dialog = $(this).innerWidth();
                        var width_display = screen.width;
                        var left = (width_display - width_dialog) / 2;

                        var h1 = $(this).find('.mdl-dialog__title').outerHeight();
                        var h2 = $(this).find('.mdl-dialog__content').innerHeight();
                        var h3 = $(this).find('.mdl-dialog__actions').innerHeight();
                        var h = h1 + h2 + h3 + 15;
                        $(this).css('min-height', h + 'px');

                        var height_dialog = $(this).innerHeight();
                        var height_display = screen.height;
                        var top = (height_display - height_dialog) / 2;

                        $(this).css('left', left + 'px').css('bottom', top + 'px');
                    }
                });
            }
        }, 100);
    }

    function exit()
    {
        $.cookie('user', '');
        $.cookie('User_ID', '');
        $.cookie('PermissionGroup_ID', '');
        $.cookie('Email', '');
        document.location.href = 'login.html';
    }

    /*Функция просто обрабатывает кнопку назад у телефона*/
    function onBackKeyDown()
    {
        if ($('.index').css('display') == 'block')
        {
            navigator.app.exitApp();
        }
        else if ((window.location.pathname == '/login.html') && (window.location.pathname == '/android_asset/www/login.html'))
        {
            navigator.app.exitApp();
        }
       else if (($('.about').css('display') == 'block') ||
            ($('.view_form_message').css('display') == 'block') ||
            ($('.contacts').css('display') == 'block') ||
            ($('.cart').css('display') == 'block') ||
            ($('.goods_discounted').css('display') == 'block') ||
            ($('.akcii').css('display') == 'block') ||
            ($('.live').css('display') == 'block'))
        {
            HideAllShowOne('index');
       }
       else if ($('.akcii_view').css('display') == 'block')
       {
           HideAllShowOne('akcii');
       }
       else if ($('.order').css('display') == 'block')
       {
           HideAllShowOne('cart');
       }
       else if ($('#functionBack').attr('f') == 'view_index')
       {
           HideAllShowOne('index');
       }
       else
       {
           var f = $('#functionBack').attr('f');
           var s = $('#functionBack').attr('s');
           var p = $('#functionBack').attr('p');
           var js = f + '(' + s + ', ' + p + ');';
           eval(js);
       }
    }

})();
