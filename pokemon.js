const PAGE_SIZE = 10;
let currentPage = 1;
let pokemons = [];
let selectedTypes = [];


//1. fetch pokemon types from the APIs, generate checkboxes with pokemon type names, filter pokemon by types. 
$(document).ready(function () {
    const apiUrl = 'https://pokeapi.co/api/v2/type';

    // Fetch Pokémon types from the APIs
    $.ajax({
        url: apiUrl,
        method: 'GET',
        success: function (response) {
            // Fetch types
            const types = response.results;

            // Generate checkboxes for each Pokémon type
            types.forEach(function (type) {
                const checkbox = $('<input type="checkbox" class="typeCheckbox" value="' + type.name + '">');
                const label = $('<label class="typeLabel">' + type.name + '</label>');

                $('#typegroup').append(checkbox);
                $('#typegroup').append(label);
            });

            // Add event listener to the checkboxes
            $('.typeCheckbox').on('change', function () {
                // Update the selected types array
                selectedTypes = $('.typeCheckbox:checked').map(function () {
                    return $(this).val();
                }).get();
                console.log(selectedTypes);

                // Reset the current page to 1
                currentPage = 1;

                // Filter and paginate the Pokémon based on the selected types
                filterAndPaginate();
            });

            // Fetch all Pokémon initially
            fetchPokemons();
        },
        error: function () {
            console.log('Error occurred while fetching Pokémon types.');
        }
    });
});

//fetch list of pokemons from API 
const fetchPokemons = async () => {
    try {
        const response = await axios.get('https://pokeapi.co/api/v2/pokemon?offset=0&limit=810');
        pokemons = response.data.results;

        filterAndPaginate();
    } catch (error) {
        console.log('Error occurred while fetching Pokémon.', error);
    }
    console.log(fetchPokemons)
};

const fetchPokemonDetails = async () => {
    const requests = pokemons.map(pokemon => axios.get(`https://pokeapi.co/api/v2/pokemon/${pokemon.name}`));
    const responses = await Promise.all(requests);
    return responses.map(response => response.data);
};

const filterAndPaginate = async () => {
    const pokemonDetails = await fetchPokemonDetails();

    // Filter Pokémon based on selected types
    const filteredPokemons = pokemonDetails.filter(pokemon => {
        for (let i = 0; i < pokemon.types.length; i++) {
            if (selectedTypes.includes(pokemon.types[i].type.name)) {
                return true;
            }
        }
        return false;
    });

    // Paginate the filtered Pokémon
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    const endIndex = startIndex + PAGE_SIZE;
    const paginatedPokemons = filteredPokemons.slice(startIndex, endIndex);

    // Update the visibility of Pokémon cards
    $('.pokeCard').each(function () {
        const pokemonName = $(this).attr('pokeName');
        const isVisible = paginatedPokemons.some(pokemon => pokemon.name === pokemonName);
        $(this).toggle(isVisible);
    });
};


//2. Populate pagination div by creating previous button/next buttons, hide previous button if page is 1, hide next button if page is 81,
//and lastly, create numbered buttons in between. 

const updatePaginationDiv = (currentPage, numPages) => {

    $('#pagination').empty();
    $('#pagination').append(`
    <button type="button" class="btn btn-primary page ml-1 prevButtons" value = "${currentPage - 1}" id="prev">Prev</button>
    `);



    const startPage = 1;
    const endPage = numPages;
    const x = currentPage;
    const prev = x - 1;
    const next = x + 1;


    if (x == 1) {
        $("#prev").hide();
    }

    if (x == 81) {
        $("#next").hide();
    }

    for (let i = Math.max(x - 2, 1); i <= Math.min(x + 2, 81); i++) {
        let buttonClass = "btn btn-primary page ml-1 numberedButtons";
        if (i == x) {
            buttonClass += " active";
        }
        $('#pagination').append(`
            <button class= "${buttonClass}" value = "${i}" > ${i}</button>
            `);
    }

    if (x < 81) {
        $('#pagination').append(`
    <button type="button" class="btn btn-primary page ml-1 nextButtons" value = "${currentPage + 1}" id="next">Next</button>
    `);
    }
};

//3. Display a specific page of Pokemon cards based on the current page, page size, and the list of Pokemon
const paginate = async (currentPage, PAGE_SIZE, pokemons) => {
    selected_pokemons = pokemons.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

    $('#pokeCards').empty()
    selected_pokemons.forEach(async (pokemon) => {
        const res = await axios.get(pokemon.url)
        $('#pokeCards').append(`
      <div class="pokeCard card" pokeName=${res.data.name}   >
        <h3>${res.data.name.toUpperCase()}</h3> 
        <img src="${res.data.sprites.front_default}" alt="${res.data.name}"/>
        <button type="button" class="btn btn-primary" data-toggle="modal" data-target="#pokeModal">
          More
        </button>
        </div>  
        `)
    })
}

//4. Populate pokemon cards, call an action once button is clicked 
const setup = async () => {
    $('#pokeCards').empty()
    let response = await axios.get('https://pokeapi.co/api/v2/pokemon?offset=0&limit=810');
    pokemons = response.data.results;


    paginate(currentPage, PAGE_SIZE, pokemons);
    const numPages = Math.ceil(pokemons.length / PAGE_SIZE);
    updatePaginationDiv(currentPage, numPages);



    // pop up modal when clicking on a pokemon card
    // each card displays pokemon's abilities, stats, types 
    $('body').on('click', '.pokeCard', async function (e) {
        const pokemonName = $(this).attr('pokeName')
        // console.log("pokemonName: ", pokemonName);
        const res = await axios.get(`https://pokeapi.co/api/v2/pokemon/${pokemonName}`)
        // console.log("res.data: ", res.data);
        const types = res.data.types.map((type) => type.type.name)
        // console.log("types: ", types);
        $('.modal-body').html(`
        <div style="width:200px">
        <img src="${res.data.sprites.other['official-artwork'].front_default}" alt="${res.data.name}"/>
        <div>
        <h3>Abilities</h3>
        <ul>
        ${res.data.abilities.map((ability) => `<li>${ability.ability.name}</li>`).join('')}
        </ul>
        </div>
        <div>
        <h3>Stats</h3>
        <ul>
        ${res.data.stats.map((stat) => `<li>${stat.stat.name}: ${stat.base_stat}</li>`).join('')}
        </ul>
        </div>
        </div>
          <h3>Types</h3>
          <ul>
          ${types.map((type) => `<li>${type}</li>`).join('')}
          </ul>
      
        `)
        $('.modal-title').html(`
        <h2>${res.data.name.toUpperCase()}</h2>
        <h5>${res.data.id}</h5>
        `)
    })


    //after clicking the buttons, update the page number accoridingly with the proper pokemons
    $('body').on('click', ".numberedButtons", async function (e) {
        currentPage = Number(e.target.value)
        paginate(currentPage, PAGE_SIZE, pokemons)

        //update pagination buttons
        updatePaginationDiv(currentPage, numPages)
    })

    $('body').on('click', ".prevButtons", async function (e) {
        currentPage = Number(e.target.value)
        paginate(currentPage, PAGE_SIZE, pokemons)

        //update pagination buttons
        updatePaginationDiv(currentPage, numPages)
    })

    $('body').on('click', ".nextButtons", async function (e) {
        currentPage = Number(e.target.value)
        paginate(currentPage, PAGE_SIZE, pokemons)

        //update pagination buttons
        updatePaginationDiv(currentPage, numPages)
    })

}


$(document).ready(setup)